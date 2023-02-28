import { Environment, useGLTF,  } from "@react-three/drei";
import { useFrame, extend } from "@react-three/fiber";
import { useRef, useState } from "react";
import gsap from "gsap";
import Smoke, { DepthSampleMaterial } from './Smoke'


extend({ DepthSampleMaterial })


export default function App() {

  const logo = useGLTF('./logo.gltf');

  const bigLogo = useRef();

  useFrame(() => {
    gsap.to(bigLogo.current.position, 3, { z: 0.5 });
    gsap.to(bigLogo.current.rotation, 4, { y: Math.PI });
  });


  return (
    <>
      <color args={['#000']} attach='background' />

      <Environment preset="city" />
          <primitive
            ref={bigLogo}
            object={logo.scene}
            scale={1}
            position={[0, 0, -2]}
          />
          <group position={[0.5, 1, -0.5]}>
            <Smoke smokeColor={'redsmoke'} scale={0.4} position={[-2, 0, 0]} />
            <Smoke smokeColor={'bluesmoke'} scale={0.4} position={[1, 0, 0]} />
            <Smoke smokeColor={'greensmoke'} scale={0.4} position={[0, -2, 0]} />
          </group>

    </>
  );
}