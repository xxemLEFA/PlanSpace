import * as THREE from "three";

export function createEnemies({ scene, plane, state, count, randomRange, minimaps = [], onHit, onDisable }) {
  const enemies = [];
  const geometry = new THREE.BoxGeometry(2.3, 1.2, 2.3);
  const bulletGeometry = new THREE.SphereGeometry(0.2, 10, 10);
  const bulletMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7b7b,
    emissive: 0xff3a3a,
    emissiveIntensity: 0.8
  });
  const bullets = [];
  const bulletPool = [];
  const tmpVec = new THREE.Vector3();
  const tmpVec2 = new THREE.Vector3();
  let activeCount = count;
  let difficulty = {
    trackRange: 50,
    fireInterval: 1.6,
    bulletSpeed: 28,
    turnRate: 2.4,
    speedMin: 12,
    speedMax: 18
  };

  for (let i = 0; i < count; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xff4d5a,
      metalness: 0.2,
      roughness: 0.6
    });
    const mesh = new THREE.Mesh(geometry, material);
    const enemy = {
      mesh,
      speed: randomRange(difficulty.speedMin, difficulty.speedMax),
      active: true,
      minimap: null,
      dir: new THREE.Vector3(0, 0, 1),
      fireCooldown: randomRange(0.3, 1.2)
    };
    enemies.push(enemy);
    scene.add(mesh);
    minimaps.forEach((map) => map.attachEnemy(enemy));
    resetEnemy(enemy, i);
  }

  function setDifficulty(next) {
    difficulty = { ...difficulty, ...next };
    enemies.forEach((enemy) => {
      enemy.speed = randomRange(difficulty.speedMin, difficulty.speedMax);
    });
  }

  function setActiveCount(nextCount) {
    activeCount = Math.max(0, Math.min(enemies.length, nextCount));
    enemies.forEach((enemy, index) => {
      if (index < activeCount) {
        enemy.active = true;
        enemy.mesh.visible = true;
        minimaps.forEach((map) => map.setEnemyVisible(enemy, true));
      } else {
        enemy.active = false;
        enemy.mesh.visible = false;
        minimaps.forEach((map) => map.setEnemyVisible(enemy, false));
      }
    });
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
    enemy.fireCooldown = randomRange(0.4, 1.4);
    minimaps.forEach((map) => map.setEnemyVisible(enemy, true));
  }

  function resetAll() {
    enemies.forEach((enemy, i) => resetEnemy(enemy, i));
    bullets.forEach((bullet) => scene.remove(bullet.mesh));
    bullets.length = 0;
    bulletPool.length = 0;
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

  function spawnBullet(position, direction) {
    const bullet = bulletPool.pop() || {
      mesh: new THREE.Mesh(bulletGeometry, bulletMaterial),
      dir: new THREE.Vector3(),
      life: 2.2
    };
    bullet.life = 2.2;
    bullet.mesh.position.copy(position);
    bullet.dir.copy(direction);
    scene.add(bullet.mesh);
    bullets.push(bullet);
  }

  function recycleBullet(index) {
    const bullet = bullets[index];
    scene.remove(bullet.mesh);
    bullets.splice(index, 1);
    bulletPool.push(bullet);
  }

  function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i -= 1) {
      const bullet = bullets[i];
      bullet.life -= dt;
      bullet.mesh.position.addScaledVector(bullet.dir, difficulty.bulletSpeed * dt);
      if (bullet.life <= 0) {
        recycleBullet(i);
        continue;
      }
      const distance = bullet.mesh.position.distanceTo(plane.position);
      if (distance < 2.2) {
        recycleBullet(i);
        onHit();
      }
    }
  }

  function update(dt) {
    const backward = tmpVec.copy(state.forward).multiplyScalar(-1);
    const toPlayer = tmpVec2;
    enemies.forEach((enemy, index) => {
      if (!enemy.active) return;
      const maxIndex = activeCount - 1;
      if (index > maxIndex) return;
      toPlayer.copy(plane.position).sub(enemy.mesh.position);
      const distance = toPlayer.length();
      let desiredDir = backward;
      if (distance < difficulty.trackRange) {
        desiredDir = toPlayer.normalize();
      }
      enemy.dir.lerp(desiredDir, Math.min(1, difficulty.turnRate * dt)).normalize();
      enemy.mesh.position.addScaledVector(enemy.dir, enemy.speed * dt);

      enemy.fireCooldown -= dt;
      if (distance < difficulty.trackRange * 0.9 && enemy.fireCooldown <= 0) {
        spawnBullet(enemy.mesh.position, enemy.dir);
        enemy.fireCooldown = difficulty.fireInterval;
      }

      if (distance < 2.2) {
        disableEnemy(enemy);
        onHit();
      }
    });

    updateBullets(dt);
  }

  return {
    enemies,
    update,
    resetAll,
    disableEnemy,
    setDifficulty,
    setActiveCount,
    getActiveCount: () => activeCount
  };
}
