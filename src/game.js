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
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
  loadPlayerModel();

  const state = {
    speed: 22,
    minSpeed: 8,
    maxSpeed: 40,
    accel: 18,
    hp: 3,
    passed: 0,
    total: 0,
    enemiesRemaining: 0,
    levelIndex: 0,
    menuActive: true,
    sideTimeRemaining: 70,
    sideStatus: "active",
    sideGatesPassed: 0,
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
  const menu = document.getElementById("menu");
  const menuConfirm = document.getElementById("menu-confirm");
  const menuLevels = document.querySelectorAll(".menu-level");
  const minimap2d = createMinimap2D({ canvas: minimap2dCanvas, plane });
  const minimap3d = createMinimap({ canvas: minimap3dCanvas, plane, debugEl });
  let minimapMode = "2d";
  const levels = [
    { enemyCount: 5, trackRange: 45, fireInterval: 2.2, bulletSpeed: 26, speedMin: 10, speedMax: 14 },
    { enemyCount: 8, trackRange: 60, fireInterval: 1.5, bulletSpeed: 32, speedMin: 12, speedMax: 17 },
    { enemyCount: 12, trackRange: 80, fireInterval: 1.0, bulletSpeed: 38, speedMin: 14, speedMax: 20 }
  ];
  const sideConfig = { time: 70 };

  const gates = createGates({
    scene,
    plane,
    count: 7,
    state,
    randomRange,
    onUpdate: () => uiController.update(),
    onPass: () => {
      if (state.sideStatus !== "active") return;
      state.sideGatesPassed += 1;
      if (state.sideGatesPassed >= gates.count) {
        state.sideStatus = "complete";
        state.sideTimeRemaining = 0;
        uiController.update();
      }
    }
  });
  state.total = gates.count;

  const enemies = createEnemies({
    scene,
    plane,
    state,
    count: Math.max(...levels.map((level) => level.enemyCount)),
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
      checkLevelCompletion();
    }
  });
  state.enemiesRemaining = levels[0].enemyCount;

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
    time: 0.8
  };
  const lockVec = new THREE.Vector3();
  const clock = new THREE.Clock();
  const mixers = [];
  const enableModelAnimations = false;
  const animationNodeFilter = ["Point001"];
  let modelFlame = null;
  let flameTime = 0;

  uiController.update();
  minimap2d.resize();
  minimap3d.resize();
  setMinimapMode(minimapMode);
  loadLeaderboard();
  initMenu();

  function resetGame() {
    state.hp = 3;
    state.passed = 0;
    state.over = false;
    state.speed = 22;
    state.enemiesRemaining = levels[state.levelIndex].enemyCount;
    state.sideTimeRemaining = sideConfig.time;
    state.sideStatus = "active";
    state.sideGatesPassed = 0;
    state.timerMs = 0;
    state.timerRunning = !state.menuActive;
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
    startLevel(state.levelIndex, false);
    uiController.update();
  }

  function animate() {
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!state.over && !state.menuActive) {
      mixers.forEach((mixer) => mixer.update(dt));
      updateModelFlame(dt);
      updateTimer(dt);
      updateSideMission(dt);
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

  function loadPlayerModel() {
    const loader = new GLTFLoader();
    const url = "/models/Baked_Animations_Intergalactic_Spaceships_Version_2/GLB/Baked_Animations_Intergalactic_Spaceships_Version_2.glb";
    const modelRoot = plane.getObjectByName("modelRoot");
    if (!modelRoot) return;
    loader.load(
      url,
      (gltf) => {
        modelRoot.clear();
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });

        model.rotation.y = Math.PI;
        fitModel(model, 7.2);
        modelRoot.add(model);
        repositionThrusters(model);
        modelFlame = findFlameNode(model);

        if (enableModelAnimations && gltf.animations && gltf.animations.length) {
          const mixer = new THREE.AnimationMixer(model);
          const filtered = gltf.animations.map((clip) => {
            const tracks = clip.tracks.filter((track) => {
              return animationNodeFilter.some((name) => track.name.startsWith(name));
            });
            return tracks.length ? new THREE.AnimationClip(`${clip.name}-filtered`, clip.duration, tracks) : null;
          }).filter(Boolean);
          if (filtered.length) {
            filtered.forEach((clip) => mixer.clipAction(clip).play());
          } else {
            gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
          }
          mixers.push(mixer);
        }
      },
      undefined,
      (err) => {
        console.error("Failed to load player model:", err);
      }
    );
  }

  function fitModel(model, targetLength) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = size.z > 0 ? targetLength / size.z : 1;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
  }

  function repositionThrusters(model) {
    const box = new THREE.Box3().setFromObject(model);
    const maxZ = box.max.z;
    const accelFlame = plane.getObjectByName("accelFlame");
    const brakeFlame = plane.getObjectByName("brakeFlame");
    if (accelFlame) {
      accelFlame.position.set(0, 0, maxZ + 0.7);
    }
    if (brakeFlame) {
      brakeFlame.position.set(0, 0, maxZ + 0.4);
    }
  }

  function findFlameNode(model) {
    let found = null;
    model.traverse((child) => {
      if (found || !child.name) return;
      if (child.name.includes("Point001") || child.name.toLowerCase().includes("flame")) {
        found = child;
      }
    });
    return found;
  }

  function updateModelFlame(dt) {
    if (!modelFlame) return;
    flameTime += dt;
    const pulse = 0.7 + 0.3 * Math.sin(flameTime * 6);
    modelFlame.scale.setScalar(1 + pulse * 0.25);
    if (modelFlame.material && modelFlame.material.emissive) {
      modelFlame.material.emissiveIntensity = 0.6 + pulse * 1.2;
      modelFlame.material.needsUpdate = true;
    }
  }

  function updateTimer(dt) {
    if (!state.timerRunning) return;
    state.timerMs += dt * 1000;
    uiController.update();
  }

  function updateSideMission(dt) {
    if (state.sideStatus !== "active") return;
    state.sideTimeRemaining = Math.max(0, state.sideTimeRemaining - dt);
    if (state.sideTimeRemaining <= 0) {
      state.sideStatus = "failed";
    }
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
    state.completed = true;
    state.timerRunning = false;
    uiController.update();
    const name = window.prompt(ui.t("promptName"));
    if (name) {
      submitScore(name, Math.round(state.timerMs));
    }
    openMenu();
  }

  function startLevel(index, showToastMessage = true) {
    const level = levels[index];
    if (!level) return;
    state.levelIndex = index;
    state.enemiesRemaining = level.enemyCount;
    state.sideTimeRemaining = sideConfig.time;
    state.sideStatus = "active";
    state.sideGatesPassed = 0;
    state.passed = 0;
    gates.resetAll();
    enemies.setDifficulty(level);
    enemies.setActiveCount(level.enemyCount);
    if (showToastMessage) {
      showToast(ui.t("levelStart", { level: index + 1 }));
    }
    uiController.update();
  }

  function checkLevelCompletion() {
    if (state.enemiesRemaining > 0) return;
    showToast(ui.t("levelClear", { level: state.levelIndex + 1 }));
    checkCompletion();
  }

  function initMenu() {
    if (!menu) return;
    menu.style.display = "flex";
    if (menuConfirm) {
      menuConfirm.textContent = ui.t("menuConfirm");
      menuConfirm.disabled = true;
    }
    menuLevels.forEach((button) => {
      button.addEventListener("click", () => {
        menuLevels.forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        const levelIndex = Number(button.dataset.level || 0);
        state.levelIndex = levelIndex;
        if (menuConfirm) {
          menuConfirm.disabled = false;
          menuConfirm.textContent = ui.t("menuConfirmLevel", { level: levelIndex + 1 });
        }
      });
    });
    if (menuConfirm) {
      menuConfirm.addEventListener("click", () => {
        startSelectedLevel();
      });
    }
    state.menuActive = true;
    updateMenuVisibility();
    updateMenuText();
  }

  function updateMenuVisibility() {
    if (!menu) return;
    menu.style.display = state.menuActive ? "flex" : "none";
  }

  function openMenu() {
    state.menuActive = true;
    state.timerRunning = false;
    updateMenuVisibility();
    if (menuConfirm) {
      menuConfirm.disabled = true;
      menuConfirm.textContent = ui.t("menuConfirm");
    }
    menuLevels.forEach((item) => item.classList.remove("selected"));
    updateMenuText();
  }

  function startSelectedLevel() {
    state.menuActive = false;
    state.timerRunning = true;
    state.completed = false;
    state.over = false;
    state.hp = 3;
    state.speed = 22;
    state.forward.set(0, 0, -1).applyQuaternion(plane.quaternion);
    plane.position.set(0, 4, 0);
    plane.quaternion.identity();
    bullets.reset();
    missiles.reset();
    lockState.target = null;
    lockState.progress = 0;
    startLevel(state.levelIndex, false);
    updateMenuVisibility();
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
      checkLevelCompletion();
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
  const menuLangEn = document.getElementById("menu-lang-en");
  const menuLangZh = document.getElementById("menu-lang-zh");
  if (langEn) {
    langEn.addEventListener("click", () => {
      updateMinimapLabel();
      updateMenuText();
      uiController.update();
      loadLeaderboard();
    });
  }
  if (langZh) {
    langZh.addEventListener("click", () => {
      updateMinimapLabel();
      updateMenuText();
      uiController.update();
      loadLeaderboard();
    });
  }
  if (menuLangEn) {
    menuLangEn.addEventListener("click", () => {
      document.getElementById("lang-en")?.click();
    });
  }
  if (menuLangZh) {
    menuLangZh.addEventListener("click", () => {
      document.getElementById("lang-zh")?.click();
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

  function updateMenuText() {
    if (!menuConfirm) return;
    if (menuConfirm.disabled) {
      menuConfirm.textContent = ui.t("menuConfirm");
      return;
    }
    menuConfirm.textContent = ui.t("menuConfirmLevel", { level: state.levelIndex + 1 });
  }
}
