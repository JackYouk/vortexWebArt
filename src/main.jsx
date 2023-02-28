import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas, useFrame } from '@react-three/fiber'
import App from './App'
import './index.css'
import { Loader } from '@react-three/drei'


function Render() {
  useFrame(({ gl }) => {
    gl.autoClear = false
  }, -1)

  useFrame(({ gl, camera, scene }) => {
    // render main scene
    gl.setRenderTarget(null)
    gl.render(scene, camera)
  }, 1)

  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
  <Canvas
    camera={{
      fov: 45,
      near: 0.1,
      far: 200,
      position: [0, 0, (window.innerWidth < 600 ? 20 : 10)]
    }}
  >
    <Suspense fallback={null}>
      <App />
    </Suspense>
    <Render />
  </Canvas>
  <Loader />
  </>,
)