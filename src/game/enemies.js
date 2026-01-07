import * as THREE from "three";

export function createEnemies({ scene, plane, state, count, randomRange, minimaps = [], onHit, onDisable }) {
  const enemies = [];
  const geometry = new THREE.BoxGeometry(2.3, 1.2, 2.3);
  const tmpVec = new THREE.Vector3();
  const tmpVec2 = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4d5a,
      metalness: 0.2,
      roughness: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    const enemy = { mesh, speed: randomRange(12, 18), active: true, minimap: null };
    enemies.push(enemy);
    scene.add(mesh);
    minimaps.forEach((map) => map.attachEnemy(enemy));
    resetEnemy(enemy, i);
  }

  function resetEnemy(enemy, index) {
    const offset = tmpVec2.set(
      randomRange(-20, 20),
      randomRange(3, 16),
      -80 - index * 35 - randomRange(0, 40)
    ).applyQuaternion(plane.quaternion);
    enemy.mesh.position.copy(plane.position).add(offset);
    enemy.active = true;
    enemy.mesh.visible = true;
    minimaps.forEach((map) => map.setEnemyVisible(enemy, true));
  }

  function resetAll() {
    enemies.forEach((enemy, i) => resetEnemy(enemy, i));
  }

  function disableEnemy(enemy) {
    if (!enemy.active) return;
    enemy.active = false;
    enemy.mesh.visible = false;
    minimaps.forEach((map) => map.setEnemyVisible(enemy, false));
    if (onDisable) {
      onDisable(enemy);
    }
  }

  function update(dt) {
    const backward = tmpVec.copy(state.forward).multiplyScalar(-1);
    enemies.forEach((enemy) => {
      if (!enemy.active) return;
      enemy.mesh.position.addScaledVector(backward, enemy.speed * dt);

      const distance = enemy.mesh.position.distanceTo(plane.position);
      if (distance < 2.2) {
        disableEnemy(enemy);
        onHit();
      }
    });
  }

  return {
    enemies,
    update,
    resetAll,
    disableEnemy
  };
}
