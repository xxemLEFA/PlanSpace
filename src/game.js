import * as THREE from "three";
import { createInput } from "./game/input.js";
import { buildPlane } from "./game/plane.js";
import { createGates } from "./game/gates.js";
import { createEnemies } from "./game/enemies.js";
import { createBullets } from "./game/bullets.js";
import { createThrusters } from "./game/thrusters.js";
import { createMinimap } from "./game/minimap.js";
import { createMinimap2D } from "./game/minimap2d.js";
import { clamp, randomRange } from "./game/utils.js";
import { createUI } from "./game/ui.js";
import { createChaseCamera } from "./game/camera.js";
import { createMissiles } from "./game/missiles.js";

export function initGame(canvas, ui) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1220);
  scene.fog = new THREE.Fog(0x0b1220, 40, 260);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);

  const ambient = new THREE.AmbientLight(0x9fb3ff, 0.6);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(20, 40, 30);
  scene.add(ambient, dirLight);

  const grid = new THREE.GridHelper(500, 80, 0x2b3a5e, 0x18233a);
  grid.position.y = -6;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  scene.add(grid);

  const plane = buildPlane();
  plane.position.set(0, 4, 0);
  scene.add(plane);

  const state = {
    speed: 22,
    minSpeed: 8,
    maxSpeed: 40,
    accel: 18,
    hp: 3,
    passed: 0,
    total: 0,
    gatesPassedTotal: 0,
    enemiesRemaining: 0,
    timerMs: 0,
    timerRunning: true,
    completed: false,
    over: false,
    forward: new THREE.Vector3(0, 0, -1),
    weapon: "gun",
    weaponLabel: "weaponGun",
    lockLabel: "lockNone",
    lockPercent: 0
  };

  const minimap2dCanvas = document.getElementById("minimap-2d");
  const minimap3dCanvas = document.getElementById("minimap-3d");
  const minimapToggle = document.getElementById("minimap-toggle");
  const debugEl = document.getElementById("debug");
  const minimap2d = createMinimap2D({ canvas: minimap2dCanvas, plane });
  const minimap3d = createMinimap({ canvas: minimap3dCanvas, plane, debugEl });
  let minimapMode = "2d";

  const gates = createGates({
    scene,
    plane,
    count: 7,
    state,
    randomRange,
    onUpdate: () => uiController.update(),
    onPass: () => {
      state.gatesPassedTotal += 1;
      checkCompletion();
    }
  });
  state.total = gates.count;

  const enemies = createEnemies({
    scene,
    plane,
    state,
    count: 10,
    randomRange,
    minimaps: [minimap2d, minimap3d],
    onHit: () => {
      state.hp -= 1;
      if (state.hp <= 0) {
        state.over = true;
      }
      uiController.update();
    },
    onDisable: () => {
      state.enemiesRemaining = Math.max(0, state.enemiesRemaining - 1);
      checkCompletion();
    }
  });
  state.enemiesRemaining = enemies.enemies.length;

  const bullets = createBullets({ scene, plane });
  const missiles = createMissiles({ scene, plane });
  const thrusters = createThrusters({ scene, plane });
  const input = createInput();
  const uiController = createUI(ui, state);
  const chaseCamera = createChaseCamera(camera, plane);
  const lockBox = document.getElementById("lock-box");
  const lockBoxText = document.getElementById("lockBoxText");
  const toast = document.getElementById("toast");
  const leaderboardList = document.getElementById("leaderboardList");
  let toastTimer = null;
  const lockState = {
    target: null,
    progress: 0
  };
  const lockConfig = {
    range: 120,
    minDot: 0.86,
    time: 1.3
  };
  const lockVec = new THREE.Vector3();
  const clock = new THREE.Clock();

  uiController.update();
  minimap2d.resize();
  minimap3d.resize();
  setMinimapMode(minimapMode);
  loadLeaderboard();

  function resetGame() {
    state.hp = 3;
    state.passed = 0;
    state.gatesPassedTotal = 0;
    state.over = false;
    state.speed = 22;
    state.enemiesRemaining = enemies.enemies.length;
    state.timerMs = 0;
    state.timerRunning = true;
    state.completed = false;
    state.forward.set(0, 0, -1).applyQuaternion(plane.quaternion);
    plane.position.set(0, 4, 0);
    plane.quaternion.identity();
    gates.resetAll();
    enemies.resetAll();
    bullets.reset();
    missiles.reset();
    lockState.target = null;
    lockState.progress = 0;
    uiController.update();
  }

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!state.over) {
      updateTimer(dt);
      updatePlane(dt);
      gates.update();
      enemies.update(dt);
      handleWeaponSwitch();
      updateLock(dt);
      bullets.update(dt, input.fire && state.weapon === "gun", enemies.enemies, enemies.disableEnemy);
      missiles.update(
        dt,
        input.fire && state.weapon === "missile" && lockState.progress >= lockConfig.time,
        lockState.target,
        enemies.enemies,
        enemies.disableEnemy
      );
    }

    minimap2d.update(enemies.enemies);
    minimap3d.update(enemies.enemies);
    updateLockUI();
    chaseCamera.update();
    renderer.render(scene, camera);
    if (minimapMode === "2d") {
      minimap2d.render();
    } else {
      minimap3d.render();
    }
    requestAnimationFrame(animate);
  }

  function updatePlane(dt) {
    const pitch = (input.pitchUp - input.pitchDown) * 1.1 * dt;
    const roll = (input.rollRight - input.rollLeft) * 1.6 * dt;
    const yaw = (input.yawRight - input.yawLeft) * 0.7 * dt;

    plane.rotateX(pitch);
    plane.rotateZ(-roll);
    plane.rotateY(yaw);

    const throttle = input.throttleUp - input.throttleDown;
    state.speed = clamp(state.speed + throttle * state.accel * dt, state.minSpeed, state.maxSpeed);
    const speed = state.speed;

    const forward = state.forward;
    forward.set(0, 0, -1).applyQuaternion(plane.quaternion);
    plane.position.addScaledVector(forward, speed * dt);

    if (plane.position.y < 1) {
      plane.position.y = 1;
    }

    thrusters.update(throttle, dt);
  }

  function updateTimer(dt) {
    if (!state.timerRunning) return;
    state.timerMs += dt * 1000;
    uiController.update();
  }

  function handleWeaponSwitch() {
    let changed = false;
    if (input.switchWeapon) {
      state.weapon = state.weapon === "gun" ? "missile" : "gun";
      input.switchWeapon = false;
      lockState.target = null;
      lockState.progress = 0;
      changed = true;
    }
    if (input.nextTarget) {
      selectNextTarget();
      input.nextTarget = false;
      changed = true;
    }
    state.weaponLabel = state.weapon === "gun" ? "weaponGun" : "weaponMissile";
    if (changed) {
      uiController.update();
      showToast(ui.t("weaponSwitched", { weapon: ui.t(state.weaponLabel) }));
    }
  }

  function updateLock(dt) {
    if (state.weapon !== "missile") {
      state.lockLabel = "lockNone";
      state.lockPercent = 0;
      return;
    }

    const candidates = getLockCandidates();
    if (!candidates.length) {
      lockState.target = null;
      lockState.progress = Math.max(0, lockState.progress - dt * 1.5);
    } else if (lockState.target && candidates.includes(lockState.target)) {
      lockState.progress = Math.min(lockConfig.time, lockState.progress + dt);
    } else {
      lockState.target = candidates[0];
      lockState.progress = 0;
    }

    if (lockState.progress >= lockConfig.time) {
      state.lockLabel = "lockReady";
      state.lockPercent = 100;
    } else if (lockState.target) {
      const percent = Math.floor((lockState.progress / lockConfig.time) * 100);
      state.lockLabel = "lockProgress";
      state.lockPercent = percent;
    } else {
      state.lockLabel = "lockNone";
      state.lockPercent = 0;
    }
    uiController.update();
  }

  function selectNextTarget() {
    if (state.weapon !== "missile") return;
    const candidates = getLockCandidates();
    if (!candidates.length) {
      lockState.target = null;
      lockState.progress = 0;
      return;
    }
    if (!lockState.target) {
      lockState.target = candidates[0];
      lockState.progress = 0;
      return;
    }
    const idx = candidates.indexOf(lockState.target);
    const next = idx === -1 ? candidates[0] : candidates[(idx + 1) % candidates.length];
    lockState.target = next;
    lockState.progress = 0;
  }

  function getLockCandidates() {
    const candidates = [];
    const forward = state.forward;
    enemies.enemies.forEach((enemy) => {
      if (!enemy.active) return;
      lockVec.copy(enemy.mesh.position).sub(plane.position);
      const distance = lockVec.length();
      if (distance > lockConfig.range) return;
      lockVec.normalize();
      const dot = lockVec.dot(forward);
      if (dot < lockConfig.minDot) return;
      candidates.push({ enemy, distance });
    });
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.map((entry) => entry.enemy);
  }

  function updateLockUI() {
    if (!lockBox || !lockBoxText) return;
    if (state.weapon !== "missile") {
      lockBox.style.display = "none";
      return;
    }

    if (!lockState.target || !lockState.target.active) {
      lockBox.style.display = "none";
      return;
    }

    const pos = lockState.target.mesh.position.clone();
    const distance = pos.distanceTo(plane.position);
    pos.project(camera);
    const rect = renderer.domElement.getBoundingClientRect();
    const x = (pos.x * 0.5 + 0.5) * rect.width;
    const y = (1 - (pos.y * 0.5 + 0.5)) * rect.height;
    if (pos.z < -1 || pos.z > 1) {
      lockBox.style.display = "none";
      return;
    }
    lockBox.style.display = "block";
    lockBox.style.left = `${rect.left + x}px`;
    lockBox.style.top = `${rect.top + y}px`;

    if (lockState.progress >= lockConfig.time) {
      lockBoxText.textContent = ui.t("lockReady");
    } else {
      const percent = Math.floor((lockState.progress / lockConfig.time) * 100);
      lockBoxText.textContent = `${percent}% · ${Math.round(distance)}m`;
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 1200);
  }

  function formatTimeMs(ms) {
    const totalSeconds = Math.max(0, ms) / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  }

  async function loadLeaderboard() {
    if (!leaderboardList) return;
    try {
      const response = await fetch("/api/score?limit=15");
      if (!response.ok) throw new Error("bad_response");
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        leaderboardList.textContent = ui.t("leaderboardEmpty");
        return;
      }
      const lines = items.map((item, index) => {
        const time = formatTimeMs(item.time_ms);
        return `${index + 1}. ${item.name}  ${time}`;
      });
      leaderboardList.textContent = lines.join("\n");
    } catch (err) {
      leaderboardList.textContent = ui.t("leaderboardEmpty");
    }
  }

  async function submitScore(name, timeMs) {
    try {
      await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timeMs })
      });
    } catch (err) {
      // ignore network errors for now
    }
    loadLeaderboard();
  }

  function checkCompletion() {
    if (state.completed) return;
    if (state.enemiesRemaining > 0) return;
    if (state.gatesPassedTotal < 2) return;
    state.completed = true;
    state.timerRunning = false;
    uiController.update();
    const name = window.prompt(ui.t("promptName"));
    if (name) {
      submitScore(name, Math.round(state.timerMs));
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    minimap2d.resize();
    minimap3d.resize();
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", (event) => {
    if (event.code === "KeyR") {
      resetGame();
    }
  });
  const testComplete = document.getElementById("test-complete");
  if (testComplete) {
    testComplete.addEventListener("click", () => {
      state.enemiesRemaining = 0;
      state.gatesPassedTotal = 2;
      checkCompletion();
    });
  }

  if (minimapToggle) {
    minimapToggle.addEventListener("click", () => {
      minimapMode = minimapMode === "2d" ? "3d" : "2d";
      setMinimapMode(minimapMode);
    });
  }

  const langEn = document.getElementById("lang-en");
  const langZh = document.getElementById("lang-zh");
  if (langEn) {
    langEn.addEventListener("click", () => {
      updateMinimapLabel();
      uiController.update();
      loadLeaderboard();
    });
  }
  if (langZh) {
    langZh.addEventListener("click", () => {
      updateMinimapLabel();
      uiController.update();
      loadLeaderboard();
    });
  }

  resetGame();
  animate();

  function setMinimapMode(mode) {
    if (minimap2dCanvas) {
      minimap2dCanvas.style.display = mode === "2d" ? "block" : "none";
    }
    if (minimap3dCanvas) {
      minimap3dCanvas.style.display = mode === "3d" ? "block" : "none";
    }
    if (debugEl) {
      debugEl.style.display = mode === "3d" ? "block" : "none";
    }
    if (mode === "2d") {
      minimap2d.resize();
    } else {
      minimap3d.resize();
    }
    updateMinimapLabel();
  }

  function updateMinimapLabel() {
    if (!minimapToggle) return;
    minimapToggle.textContent = minimapMode === "2d" ? ui.t("map2d") : ui.t("map3d");
  }
}
