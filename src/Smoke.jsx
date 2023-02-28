import * as THREE from 'three'
import { shaderMaterial, useFBO, useTexture } from '@react-three/drei'
import { extend, useFrame, useThree } from '@react-three/fiber'
import useStore from './store'

import { Suspense, useEffect, useRef, useState } from 'react'

import { Vector2 } from 'three'

const defaultVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
}`

export const DepthSampleMaterial = shaderMaterial(
  {
    u_depth: null,
    cameraNear: 0,
    cameraFar: 1
  },
  defaultVertexShader,
  /* glsl */ `
#include <packing>
  
varying vec2 vUv;
uniform sampler2D u_depth;

uniform float cameraNear;
uniform float cameraFar;

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
  return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}



void main() {
  float depth = readDepth( u_depth, vUv );

  gl_FragColor.rgb = 1.0 - vec3( depth );
  gl_FragColor.a = 1.0;
}
`
)

const DepthFadeMaterial = shaderMaterial(
  {
    u_depth: null,
    u_resolution: new Vector2(0, 0),
    u_map: null,
    u_range: new Vector2(0, 1),
    u_time: 0,
    cameraNear: 0,
    cameraFar: 1
  },
  /* glsl */ `
varying float vWorldZ;
varying vec2 vUv;

void main() {

    vec4 instancePosition = instanceMatrix * vec4(position, 1.);
    vec4 worldPosition = modelMatrix *  instancePosition;
    vec4 viewPosition = viewMatrix * worldPosition;

    vUv = uv;
  
    gl_Position = projectionMatrix  * viewPosition;
    vWorldZ = viewPosition.z;
}
`,
  /* glsl */ `
#include <packing>
  
uniform sampler2D u_depth;
uniform vec2 u_resolution;
uniform sampler2D u_map;
uniform float u_time;

uniform float cameraNear;
uniform float cameraFar;

uniform vec2 u_range;

varying vec2 vUv;
varying float vWorldZ;

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
  return viewZ;
}

void main() {
  vec2  sUv = gl_FragCoord.xy / u_resolution;
  float depth = readDepth( u_depth, sUv);

  float x = vWorldZ - depth;

  x = smoothstep(u_range.x, u_range.y, x);

  vec4 color = texture2D(u_map, vUv);

  gl_FragColor.rgb = vec3(color.rgb);

  gl_FragColor.a = min(color.a * 2., x);
}
`
)

extend({ DepthFadeMaterial })

function MyParticles({ smokeColor, depthTexture, ...props }) {
  const camera = useThree((state) => state.camera)

  const depthParticle = useRef()
  const smoke = useTexture(`./${smokeColor}.png`)

  const dfMaterial = useRef()
  const instance = useRef()

  const random = Math.random()

  useFrame(({ clock }) => {
    if (dfMaterial.current) {
      dfMaterial.current.uniforms.u_time.value = clock.getElapsedTime()
      dfMaterial.current.uniforms.u_range.value.set(0, 0.8)
      dfMaterial.current.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
    }
  })

  const NUM = 10
  const [objects] = useState(() => [...new Array(NUM * NUM)].map(() => new THREE.Object3D()))

  useEffect(() => {
    let id = 0

    for (let x = -NUM / 2; x < NUM / 2; x += 1) {
      for (let y = -NUM / 2; y < NUM / 2; y += 1) {
        objects[id].position.set(
          Math.sin(x + y) * Math.random() * 5,
          Math.cos(x + y) * Math.random() * 5,
          Math.random() * 1.5
        )

        objects[id].rotation.set(0, 0, Math.random() * Math.PI)
        objects[id].scale.setScalar(Math.random() * 4 + 1)

        objects[id].updateMatrix()
        instance.current.setMatrixAt(id, objects[id++].matrix)
      }
    }
    instance.current.instanceMatrix.needsUpdate = true
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    let id = 0

    for (let x = 0; x < NUM * NUM; x++) {
      objects[id].rotation.z += 0.01

      objects[id].updateMatrix()
      instance.current.setMatrixAt(id, objects[id++].matrix)
    }
    instance.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={instance} args={[null, null, NUM * NUM]}>
        <planeGeometry args={[1, 1]} />
        <depthFadeMaterial
          ref={dfMaterial}
          cameraNear={camera.near}
          cameraFar={camera.far}
          transparent
          depthWrite={false}
          u_map={smoke}
          u_depth={depthTexture}
        />
      </instancedMesh>
    </>
  )
}

  
function Smoke({scale, position, smokeColor}) {
  useStore((state) => state.rTarget)

  const depthFBO = useFBO(window.innerWidth, window.innerHeight)

  useEffect(() => {
    if (depthFBO) {
      depthFBO.depthBuffer = true
      depthFBO.depthTexture = new THREE.DepthTexture()
      depthFBO.depthTexture.format = THREE.DepthFormat
      depthFBO.depthTexture.type = THREE.UnsignedShortType
    }
  }, [depthFBO])

  useEffect(() => {
    useStore.setState({
      rTarget: depthFBO
    })
  })

  useFrame(({ gl, scene, camera }) => {
    gl.setRenderTarget(depthFBO)
    gl.render(scene, camera)
  }, -2)

//   const mesh = useRef()

//   useFrame(({ clock }) => {
//     mesh.current.rotation.x += 0.0125
//     mesh.current.rotation.y += 0.0125
//   })

  return (
    <>
        <group scale={scale} position={position}>
        <MyParticles depthTexture={depthFBO?.depthTexture} smokeColor={smokeColor} />
        </group>
    </>
  )
}
export default Smoke
