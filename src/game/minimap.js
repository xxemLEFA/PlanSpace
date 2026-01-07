import * as THREE from "three";

export function createMinimap({ canvas, plane, debugEl, range = 120, scale = 0.08 }) {
  if (!canvas) {
    const noop = () => {};
    return { resize: noop, update: noop, render: noop, attachEnemy: noop, setEnemyVisible: noop };
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  const group = new THREE.Group();
  const tmpVec = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpForward = new THREE.Vector3();
  const baseForward = new THREE.Vector3(0, 0, -1);
  const lastArrowQuat = new THREE.Quaternion();
  const tmpEuler = new THREE.Euler(0, 0, 0, "YXZ");
  let lastMapYaw = 0;

  scene.add(group);
  renderer.setClearColor(0x000000, 0);

  const radius = range * scale;
  const ringGeometry = new THREE.RingGeometry(radius - 0.05, radius, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x28406b,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const gridHelper = new THREE.GridHelper(radius * 2, 8, 0x1d355d, 0x13264a);
  gridHelper.material.opacity = 0.35;
  gridHelper.material.transparent = true;
  group.add(gridHelper);

  const arrowGroup = new THREE.Group();
  arrowGroup.name = "minimapArrow";
  arrowGroup.position.y = 0.12;

  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, -1.1);
  arrowShape.lineTo(0.6, 0.2);
  arrowShape.lineTo(0.22, 0.2);
  arrowShape.lineTo(0.22, 1.1);
  arrowShape.lineTo(-0.22, 1.1);
  arrowShape.lineTo(-0.22, 0.2);
  arrowShape.lineTo(-0.6, 0.2);
  arrowShape.lineTo(0, -1.1);

  const arrowGeo = new THREE.ShapeGeometry(arrowShape);
  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0x6fe6ff,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  arrowMesh.rotation.x = Math.PI / 2;
  arrowGroup.add(arrowMesh);

  group.add(arrowGroup);

  camera.position.set(0, 10, 12);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height || 1;
    camera.updateProjectionMatrix();
  }

  function attachEnemy(enemy) {
    if (enemy.minimap) return;
    enemy.minimap = createMinimapMarker();
    group.add(enemy.minimap.marker);
    group.add(enemy.minimap.line);
  }

  function setEnemyVisible(enemy, visible) {
    if (!enemy.minimap) return;
    enemy.minimap.marker.visible = visible;
    enemy.minimap.line.visible = visible;
  }

  function update(enemies) {
    tmpQuat.copy(plane.quaternion).invert();
    const arrow = group.getObjectByName("minimapArrow");
    if (arrow) {
      plane.getWorldDirection(tmpForward);
      tmpForward.y = 0;
      if (tmpForward.lengthSq() > 0.0001) {
        tmpForward.normalize();
        tmpQuat.setFromUnitVectors(baseForward, tmpForward);
        arrow.quaternion.copy(tmpQuat);
        lastArrowQuat.copy(tmpQuat);
        lastMapYaw = Math.atan2(tmpForward.x, tmpForward.z);
      } else {
        arrow.quaternion.copy(lastArrowQuat);
      }
    }

    if (debugEl) {
      tmpEuler.setFromQuaternion(plane.quaternion, "YXZ");
      const planeYaw = THREE.MathUtils.radToDeg(tmpEuler.y);
      const mapYaw = THREE.MathUtils.radToDeg(lastMapYaw);
      debugEl.textContent = `mapYaw ${mapYaw.toFixed(1)} deg\nplaneYaw ${planeYaw.toFixed(1)} deg`;
    }

    enemies.forEach((enemy) => {
      if (!enemy.active) return;
      tmpVec.copy(enemy.mesh.position).sub(plane.position).applyQuaternion(tmpQuat);
      const x = tmpVec.x * scale;
      const y = tmpVec.y * scale;
      const z = tmpVec.z * scale;

      if (enemy.minimap) {
        enemy.minimap.marker.position.set(x, y, z);
        updateMinimapLine(enemy.minimap.line, x, y, z);
        enemy.minimap.marker.visible = true;
        enemy.minimap.line.visible = true;
      }
    });
  }

  function render() {
    renderer.render(scene, camera);
  }

  function createMinimapMarker() {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff6b6b })
    );
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array([0, 0, 0, 0, 0, 0]);
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0xffb38a, transparent: true, opacity: 0.7 })
    );
    return { marker, line };
  }

  function updateMinimapLine(line, x, y, z) {
    const positions = line.geometry.attributes.position.array;
    positions[0] = x;
    positions[1] = 0;
    positions[2] = z;
    positions[3] = x;
    positions[4] = y;
    positions[5] = z;
    line.geometry.attributes.position.needsUpdate = true;
  }

  return {
    resize,
    update,
    render,
    attachEnemy,
    setEnemyVisible
  };
}
