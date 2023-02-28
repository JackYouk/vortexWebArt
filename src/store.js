import * as THREE from 'three'
import createStore from 'zustand'

const useStore = createStore((set, get) => ({
  fields: {
    sphereField: {
      radius: 12,
      position: new THREE.Vector3(0, 0, 100),
      range: [0, 10],
      falloff: undefined
    }
  },
  rTarget: null,
  gTarget: null,
  bTarget: null,
  aTarget: null,
  transforming: false,
  orbitControls: null
}))

export default useStore
