import * as THREE from "three";

export function createBullets({ scene, plane }) {
  const bullets = [];
  const bulletPool = [];
  const bulletGeometry = new THREE.SphereGeometry(0.18, 12, 12);
  const bulletMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe6a3,
    emissive: 0xff9b3a,
    emissiveIntensity: 1
  });
  let fireCooldown = 0;

  function reset() {
    bullets.forEach((bullet) => scene.remove(bullet.mesh));
    bullets.length = 0;
    bulletPool.length = 0;
  }

  function spawnBullet() {
    const bullet = bulletPool.pop() || {
      mesh: new THREE.Mesh(bulletGeometry, bulletMaterial),
      dir: new THREE.Vector3(),
      speed: 75,
      life: 1.4
    };
    bullet.life = 1.4;
    bullet.mesh.position.copy(plane.position);
    bullet.mesh.position.add(new THREE.Vector3(0, 0.3, -1.6).applyQuaternion(plane.quaternion));
    bullet.dir.set(0, 0, -1).applyQuaternion(plane.quaternion);
    scene.add(bullet.mesh);
    bullets.push(bullet);
  }

  function recycleBullet(index) {
    const bullet = bullets[index];
    scene.remove(bullet.mesh);
    bullets.splice(index, 1);
    bulletPool.push(bullet);
  }

  function update(dt, isFiring, enemies, disableEnemy) {
    if (isFiring && fireCooldown <= 0) {
      spawnBullet();
      fireCooldown = 0.18;
    }
    fireCooldown = Math.max(0, fireCooldown - dt);

    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const bullet = bullets[i];
      bullet.life -= dt;
      bullet.mesh.position.addScaledVector(bullet.dir, bullet.speed * dt);

      if (bullet.life <= 0) {
        recycleBullet(i);
        continue;
      }

      for (let j = 0; j < enemies.length; j += 1) {
        const enemy = enemies[j];
        if (!enemy.active) continue;
        const hitDistance = enemy.mesh.position.distanceTo(bullet.mesh.position);
        if (hitDistance < 1.6) {
          disableEnemy(enemy);
          recycleBullet(i);
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
