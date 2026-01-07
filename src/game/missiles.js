import * as THREE from "three";

export function createMissiles({ scene, plane }) {
  const missiles = [];
  const missilePool = [];
  const missileGeometry = new THREE.CylinderGeometry(0.12, 0.2, 1, 10);
  const missileMaterial = new THREE.MeshStandardMaterial({
    color: 0x8ff3ff,
    emissive: 0x1aa6ff,
    emissiveIntensity: 0.8
  });
  let fireCooldown = 0;
  const tmpVec = new THREE.Vector3();

  function spawnMissile(target) {
    const missile = missilePool.pop() || {
      mesh: new THREE.Mesh(missileGeometry, missileMaterial),
      dir: new THREE.Vector3(0, 0, -1),
      speed: 42,
      life: 3.2,
      target: null
    };
    missile.life = 3.2;
    missile.target = target;
    missile.mesh.position.copy(plane.position);
    missile.mesh.position.add(new THREE.Vector3(0, 0.2, -1.4).applyQuaternion(plane.quaternion));
    missile.dir.set(0, 0, -1).applyQuaternion(plane.quaternion);
    missile.mesh.quaternion.copy(plane.quaternion);
    scene.add(missile.mesh);
    missiles.push(missile);
  }

  function recycleMissile(index) {
    const missile = missiles[index];
    scene.remove(missile.mesh);
    missiles.splice(index, 1);
    missilePool.push(missile);
  }

  function reset() {
    missiles.forEach((missile) => scene.remove(missile.mesh));
    missiles.length = 0;
    missilePool.length = 0;
  }

  function update(dt, isFiring, lockTarget, enemies, disableEnemy) {
    if (isFiring && lockTarget && fireCooldown <= 0) {
      spawnMissile(lockTarget);
      fireCooldown = 0.6;
    }
    fireCooldown = Math.max(0, fireCooldown - dt);

    for (let i = missiles.length - 1; i >= 0; i -= 1) {
      const missile = missiles[i];
      missile.life -= dt;

      if (missile.target && missile.target.active) {
        tmpVec.copy(missile.target.mesh.position).sub(missile.mesh.position).normalize();
        missile.dir.lerp(tmpVec, 0.12).normalize();
      }

      missile.mesh.position.addScaledVector(missile.dir, missile.speed * dt);
      missile.mesh.lookAt(missile.mesh.position.clone().add(missile.dir));

      if (missile.life <= 0) {
        recycleMissile(i);
        continue;
      }

      for (let j = 0; j < enemies.length; j += 1) {
        const enemy = enemies[j];
        if (!enemy.active) continue;
        const hitDistance = enemy.mesh.position.distanceTo(missile.mesh.position);
        if (hitDistance < 2.0) {
          disableEnemy(enemy);
          recycleMissile(i);
          break;
        }
      }
    }
  }

  return {
    update,
    reset
  };
}
