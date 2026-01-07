import * as THREE from "three";

export function createMinimap2D({ canvas, plane, range = 120 }) {
  if (!canvas) {
    const noop = () => {};
    return { resize: noop, update: noop, render: noop, attachEnemy: noop, setEnemyVisible: noop };
  }

  const ctx = canvas.getContext("2d");
  const tmpVec = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  let width = 1;
  let height = 1;
  let radius = 1;
  let scale = 1;
  let pendingEnemies = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    radius = Math.max(1, Math.min(width, height) / 2 - 10);
    scale = radius / range;
  }

  function update(enemies) {
    pendingEnemies = enemies;
  }

  function render() {
    if (width < 2 || height < 2 || radius <= 0) {
      return;
    }
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, -1);

    ctx.strokeStyle = "rgba(120, 150, 210, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(120, 150, 210, 0.2)";
    ctx.beginPath();
    ctx.moveTo(-radius, 0);
    ctx.lineTo(radius, 0);
    ctx.moveTo(0, -radius);
    ctx.lineTo(0, radius);
    ctx.stroke();

    drawPlaneArrow();
    drawEnemies();

    ctx.restore();
  }

  function drawPlaneArrow() {
    ctx.save();
    ctx.fillStyle = "rgba(111, 230, 255, 0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemies() {
    tmpQuat.copy(plane.quaternion).invert();
    pendingEnemies.forEach((enemy) => {
      if (!enemy.active) return;
      tmpVec.copy(enemy.mesh.position).sub(plane.position).applyQuaternion(tmpQuat);

      const x = tmpVec.x * scale;
      const y = -tmpVec.z * scale;
      const dist = Math.hypot(x, y);
      const clampedRadius = radius - 2;
      let drawX = x;
      let drawY = y;
      if (dist > clampedRadius) {
        const clampScale = clampedRadius / dist;
        drawX *= clampScale;
        drawY *= clampScale;
      }

      ctx.fillStyle = dist > clampedRadius ? "rgba(255, 120, 120, 0.75)" : "rgba(255, 120, 120, 0.9)";
      ctx.beginPath();
      ctx.arc(drawX, drawY, dist > clampedRadius ? 2.5 : 3, 0, Math.PI * 2);
      ctx.fill();

      const heightDelta = enemy.mesh.position.y - plane.position.y;
      if (Math.abs(heightDelta) > 3) {
        const arrowOffset = 6;
        ctx.strokeStyle = heightDelta > 0 ? "rgba(150, 210, 255, 0.9)" : "rgba(255, 170, 120, 0.9)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        if (heightDelta > 0) {
          ctx.moveTo(drawX - 3, drawY + arrowOffset);
          ctx.lineTo(drawX, drawY + arrowOffset + 4);
          ctx.lineTo(drawX + 3, drawY + arrowOffset);
        } else {
          ctx.moveTo(drawX - 3, drawY - arrowOffset);
          ctx.lineTo(drawX, drawY - arrowOffset - 4);
          ctx.lineTo(drawX + 3, drawY - arrowOffset);
        }
        ctx.stroke();
      }
    });
  }

  function getPlaneYaw() {
    tmpVec.set(0, 0, -1).applyQuaternion(plane.quaternion);
    return Math.atan2(tmpVec.x, tmpVec.z);
  }

  return {
    resize,
    update,
    render,
    attachEnemy: () => {},
    setEnemyVisible: () => {}
  };
}
