import * as THREE from "three";

export function createGates({ scene, plane, count, state, randomRange, onUpdate, onPass }) {
  const gates = [];
  const geometry = new THREE.TorusGeometry(3.5, 0.35, 16, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffc857,
    emissive: 0x331900,
    metalness: 0.4,
    roughness: 0.3
  });

  for (let i = 0; i < count; i += 1) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.rotation.x = Math.PI / 2;
    const gate = { mesh, radius: 3.5, passed: false };
    resetGate(gate, i);
    gates.push(gate);
    scene.add(mesh);
  }

  function resetGate(gate, index) {
    gate.passed = false;
    gate.mesh.position.set(
      randomRange(-18, 18),
      randomRange(3, 14),
      -60 - index * 50 - randomRange(0, 25)
    );
  }

  function resetAll() {
    gates.forEach((gate, i) => resetGate(gate, i));
  }

  function update() {
    gates.forEach((gate) => {
      if (gate.passed) return;
      const distance = gate.mesh.position.distanceTo(plane.position);
      if (distance < gate.radius * 0.85) {
        gate.passed = true;
        state.passed += 1;
        onUpdate();
        if (onPass) {
          onPass();
        }
      }
    });

    if (state.passed === count) {
      state.passed = 0;
      resetAll();
      onUpdate();
    }
  }

  return {
    gates,
    count,
    resetAll,
    update
  };
}
