import * as THREE from "three";
import { clamp, randomRange } from "./utils.js";

export function createThrusters({ scene, plane }) {
  const thrusterParticles = [];
  const thrusterPool = [];
  const thrusterGeometry = new THREE.SphereGeometry(0.18, 10, 10);
  const thrusterMaterial = new THREE.MeshStandardMaterial({
    color: 0x7be7ff,
    emissive: 0x2aa6ff,
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const thrusterTrailGeometry = new THREE.CylinderGeometry(0.08, 0.28, 1, 8, 1, true);
  const thrusterTrailMaterial = new THREE.MeshBasicMaterial({
    color: 0x7be7ff,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  let particleCooldown = 0;
  const tmpVec = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const upVec = new THREE.Vector3(0, 1, 0);

  function update(throttle, dt) {
    const accelFlame = plane.getObjectByName("accelFlame");
    const brakeFlame = plane.getObjectByName("brakeFlame");
    if (!accelFlame || !brakeFlame) return;
    const fireRate = throttle !== 0 ? 0.03 : 0.08;

    if (throttle > 0) {
      accelFlame.scale.set(1, 1 + throttle * 0.8, 1);
      brakeFlame.scale.set(0.001, 0.001, 0.001);
      spawnParticles(accelFlame.getWorldPosition(new THREE.Vector3()), 1, fireRate, dt);
    } else if (throttle < 0) {
      brakeFlame.scale.set(1, 1 + Math.abs(throttle) * 0.6, 1);
      accelFlame.scale.set(0.001, 0.001, 0.001);
      spawnParticles(brakeFlame.getWorldPosition(new THREE.Vector3()), -1, fireRate, dt);
    } else {
      accelFlame.scale.set(0.001, 0.001, 0.001);
      brakeFlame.scale.set(0.001, 0.001, 0.001);
    }

    updateParticles(dt);
  }

  function spawnParticles(origin, direction, fireRate, dt) {
    particleCooldown = Math.max(0, particleCooldown - dt);
    if (particleCooldown > 0) return;
    particleCooldown = fireRate;

    const particle = thrusterPool.pop() || {
      mesh: new THREE.Mesh(thrusterGeometry, thrusterMaterial.clone()),
      trail: new THREE.Mesh(thrusterTrailGeometry, thrusterTrailMaterial.clone()),
      velocity: new THREE.Vector3(),
      life: 0,
      maxLife: 0.7
    };

    const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(plane.quaternion);
    const spread = 0.6;
    particle.velocity.copy(backward)
      .multiplyScalar(14 * direction)
      .add(new THREE.Vector3(randomRange(-spread, spread), randomRange(-spread, spread), randomRange(-spread, spread)));
    particle.mesh.position.copy(origin);
    particle.mesh.material.color.set(direction > 0 ? 0x7be7ff : 0xffa35c);
    particle.mesh.material.emissive.set(direction > 0 ? 0x2aa6ff : 0xff3a1a);
    particle.mesh.material.opacity = 0.95;
    particle.mesh.scale.setScalar(1);
    particle.trail.material.color.set(direction > 0 ? 0x7be7ff : 0xffa35c);
    particle.trail.material.opacity = 0.75;
    particle.life = 0.7;
    particle.maxLife = 0.7;

    scene.add(particle.mesh);
    scene.add(particle.trail);
    thrusterParticles.push(particle);
  }

  function updateParticles(dt) {
    for (let i = thrusterParticles.length - 1; i >= 0; i -= 1) {
      const particle = thrusterParticles[i];
      particle.life -= dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.material.opacity = Math.max(0, particle.life / particle.maxLife);
      particle.mesh.scale.setScalar(1 + (1 - particle.life / particle.maxLife) * 0.6);
      updateTrail(particle);

      if (particle.life <= 0) {
        recycleParticle(i);
      }
    }
  }

  function recycleParticle(index) {
    const particle = thrusterParticles[index];
    scene.remove(particle.mesh);
    scene.remove(particle.trail);
    thrusterParticles.splice(index, 1);
    thrusterPool.push(particle);
  }

  function updateTrail(particle) {
    const speed = particle.velocity.length();
    if (speed <= 0.01) return;

    const dir = tmpVec.copy(particle.velocity).normalize();
    const lifeRatio = particle.life / particle.maxLife;
    const length = clamp(speed * 0.055, 0.5, 2.2) * (0.6 + lifeRatio * 0.9);

    particle.trail.scale.set(1, length, 1);
    particle.trail.material.opacity = 0.35 * lifeRatio;

    tmpQuat.setFromUnitVectors(upVec, dir);
    particle.trail.quaternion.copy(tmpQuat);
    particle.trail.position.copy(particle.mesh.position).addScaledVector(dir, -length * 0.5);
  }

  return {
    update
  };
}
