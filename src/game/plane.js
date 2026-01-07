import * as THREE from "three";

export function buildPlane() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.7, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x4cc3ff, metalness: 0.2, roughness: 0.4 })
  );
  body.position.z = -0.2;

  const wing = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.15, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x1c2a44, metalness: 0.1, roughness: 0.7 })
  );
  wing.position.set(0, 0, -0.2);

  const fin = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.2, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x1c2a44, metalness: 0.1, roughness: 0.7 })
  );
  fin.position.set(0, 0.7, 1.2);

  const engine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0x8294b4, metalness: 0.6, roughness: 0.25 })
  );
  engine.rotation.x = Math.PI / 2;
  engine.position.set(0, 0, 2.2);

  const flameGeo = new THREE.ConeGeometry(0.35, 1.2, 16);
  const accelMat = new THREE.MeshStandardMaterial({
    color: 0x5dd7ff,
    emissive: 0x2aa6ff,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: 0.85
  });
  const brakeMat = new THREE.MeshStandardMaterial({
    color: 0xff8a3d,
    emissive: 0xff3a1a,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.8
  });

  const accelFlame = new THREE.Mesh(flameGeo, accelMat);
  accelFlame.rotation.x = Math.PI / 2;
  accelFlame.position.set(0, 0, 2.9);
  accelFlame.scale.set(0.001, 0.001, 0.001);
  accelFlame.name = "accelFlame";

  const brakeFlame = new THREE.Mesh(flameGeo, brakeMat);
  brakeFlame.rotation.x = Math.PI / 2;
  brakeFlame.position.set(0, 0, 2.6);
  brakeFlame.scale.set(0.001, 0.001, 0.001);
  brakeFlame.name = "brakeFlame";

  group.add(body, wing, fin, engine, accelFlame, brakeFlame);
  return group;
}
