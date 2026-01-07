const strings = {
  en: {
    title: "PlanSpace: Flight Trial",
    missionTitle: "Mission",
    radar: "Radar",
    map2d: "Map: 2D",
    map3d: "Map: 3D",
    mission: "Pass through {total} gates",
    status: "Gates: {passed}/{total}  Hull: {hp}",
    weapon: "Weapon: {weapon}  Lock: {lock}",
    weaponGun: "GUN",
    weaponMissile: "MISSILE",
    weaponSwitched: "Weapon: {weapon}",
    lockNone: "None",
    lockProgress: "{percent}%",
    lockReady: "Locked",
    lockRange: "LOCK RANGE {range}m",
    targetRange: "TARGET {range}m",
    timer: "Time: {time}",
    timerStopped: "Final Time: {time}",
    promptName: "Enter your name",
    leaderboardTitle: "Leaderboard (Top 15)",
    leaderboardEmpty: "No records yet",
    controls: "W/S throttle  A/D yaw  Numpad 8/5 pitch  Numpad 4/6 roll  Q target  E weapon  Space fire  R reset",
    gameover: "Hull breached. Press R to restart"
  },
  zh: {
    title: "PlanSpace: 飞行试炼",
    missionTitle: "任务",
    radar: "雷达",
    map2d: "地图：2D",
    map3d: "地图：3D",
    mission: "穿过 {total} 个航道门",
    status: "航道门: {passed}/{total}  机体: {hp}",
    weapon: "武器: {weapon}  锁定: {lock}",
    weaponGun: "机炮",
    weaponMissile: "导弹",
    weaponSwitched: "武器：{weapon}",
    lockNone: "无",
    lockProgress: "{percent}%",
    lockReady: "已锁定",
    lockRange: "锁定范围 {range}m",
    targetRange: "目标 {range}m",
    timer: "计时: {time}",
    timerStopped: "最终时间: {time}",
    promptName: "请输入你的名字",
    leaderboardTitle: "排行榜（前15）",
    leaderboardEmpty: "暂无记录",
    controls: "W/S 速度  A/D 偏航  小键盘8/5 俯仰  小键盘4/6 横滚  Q 切目标  E 切武器  空格 开火  R 重置",
    gameover: "机体受损，按 R 重新开始"
  }
};

function format(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : "";
  });
}

export function initI18n() {
  const elements = {
    title: document.querySelector('[data-i18n="title"]'),
    missionTitle: document.querySelector('[data-i18n="missionTitle"]'),
    leaderboardTitle: document.querySelector('[data-i18n="leaderboardTitle"]'),
    controls: document.querySelector('[data-i18n="controls"]'),
    missionText: document.getElementById("missionText"),
    statusText: document.getElementById("statusText"),
    weaponText: document.getElementById("weaponText"),
    timerText: document.getElementById("timerText")
  };

  let lang = "en";

  function renderStatic() {
    elements.title.textContent = strings[lang].title;
    elements.missionTitle.textContent = strings[lang].missionTitle;
    elements.controls.textContent = strings[lang].controls;
    if (elements.leaderboardTitle) {
      elements.leaderboardTitle.textContent = strings[lang].leaderboardTitle;
    }
  }

  function setLanguage(next) {
    lang = strings[next] ? next : "en";
    renderStatic();
  }

  function t(key, vars = {}) {
    const template = strings[lang][key] || "";
    return format(template, vars);
  }

  document.getElementById("lang-en").addEventListener("click", () => setLanguage("en"));
  document.getElementById("lang-zh").addEventListener("click", () => setLanguage("zh"));

  renderStatic();

  return {
    t,
    setLanguage,
    elements
  };
}

