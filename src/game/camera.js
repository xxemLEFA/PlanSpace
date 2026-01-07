import * as THREE from "three";

export function createChaseCamera(camera, plane) {
  const offset = new THREE.Vector3(0, 6, 18);
  const desired = new THREE.Vector3();

  function update() {
    desired.copy(offset).applyQuaternion(plane.quaternion).add(plane.position);
    camera.position.lerp(desired, 0.08);
    camera.lookAt(plane.position);
  }

  return {
    update
  };
}
