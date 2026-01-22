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
    level: "Level {level}",
    sideMission: "Side: Clear gates in {time}s",
    sideComplete: "Side: Completed",
    sideFailed: "Side: Failed",
    levelStart: "Level {level} start",
    levelClear: "Level {level} clear",
    menuTitle: "PlanSpace Flight",
    menuSubtitle: "Select Mission",
    level1Title: "Trial Run",
    level1Desc: "5 enemies, low aggression",
    level2Title: "Skirmish",
    level2Desc: "8 enemies, mid aggression",
    level3Title: "Siege",
    level3Desc: "12 enemies, high aggression",
    menuConfirm: "Confirm",
    menuConfirmLevel: "Start Level {level}",
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
    level: "关卡 {level}",
    sideMission: "支线：{time}s 内穿过全部门",
    sideComplete: "支线：完成",
    sideFailed: "支线：失败",
    levelStart: "关卡 {level} 开始",
    levelClear: "关卡 {level} 完成",
    menuTitle: "PlanSpace 飞行任务",
    menuSubtitle: "选择关卡",
    level1Title: "试飞",
    level1Desc: "5 个敌人，低强度",
    level2Title: "遭遇战",
    level2Desc: "8 个敌人，中强度",
    level3Title: "围攻",
    level3Desc: "12 个敌人，高强度",
    menuConfirm: "确认",
    menuConfirmLevel: "开始关卡 {level}",
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
    menuTitle: document.querySelector('[data-i18n="menuTitle"]'),
    menuSubtitle: document.querySelector('[data-i18n="menuSubtitle"]'),
    level1Title: document.querySelector('[data-i18n="level1Title"]'),
    level1Desc: document.querySelector('[data-i18n="level1Desc"]'),
    level2Title: document.querySelector('[data-i18n="level2Title"]'),
    level2Desc: document.querySelector('[data-i18n="level2Desc"]'),
    level3Title: document.querySelector('[data-i18n="level3Title"]'),
    level3Desc: document.querySelector('[data-i18n="level3Desc"]'),
    controls: document.querySelector('[data-i18n="controls"]'),
    missionText: document.getElementById("missionText"),
    statusText: document.getElementById("statusText"),
    levelText: document.getElementById("levelText"),
    sideText: document.getElementById("sideText"),
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
    if (elements.menuTitle) {
      elements.menuTitle.textContent = strings[lang].menuTitle;
    }
    if (elements.menuSubtitle) {
      elements.menuSubtitle.textContent = strings[lang].menuSubtitle;
    }
    if (elements.level1Title) {
      elements.level1Title.textContent = strings[lang].level1Title;
    }
    if (elements.level1Desc) {
      elements.level1Desc.textContent = strings[lang].level1Desc;
    }
    if (elements.level2Title) {
      elements.level2Title.textContent = strings[lang].level2Title;
    }
    if (elements.level2Desc) {
      elements.level2Desc.textContent = strings[lang].level2Desc;
    }
    if (elements.level3Title) {
      elements.level3Title.textContent = strings[lang].level3Title;
    }
    if (elements.level3Desc) {
      elements.level3Desc.textContent = strings[lang].level3Desc;
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

