export function createUI(ui, state) {
  function formatTime(ms) {
    const totalSeconds = Math.max(0, ms) / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  }

  function update() {
    ui.elements.missionText.textContent = ui.t("mission", { total: state.total });
    if (state.over) {
      ui.elements.statusText.textContent = ui.t("gameover", { hp: state.hp });
      if (ui.elements.weaponText) {
        ui.elements.weaponText.textContent = ui.t("weapon", {
          weapon: ui.t(state.weaponLabel),
          lock: ui.t(state.lockLabel)
        });
      }
      if (ui.elements.timerText) {
        ui.elements.timerText.textContent = ui.t("timerStopped", {
          time: formatTime(state.timerMs || 0)
        });
      }
      return;
    }
    ui.elements.statusText.textContent = ui.t("status", {
      passed: state.passed,
      total: state.total,
      hp: state.hp
    });
    if (ui.elements.weaponText) {
      ui.elements.weaponText.textContent = ui.t("weapon", {
        weapon: ui.t(state.weaponLabel),
        lock: state.lockLabel.startsWith("lockProgress")
          ? ui.t("lockProgress", { percent: state.lockPercent })
          : ui.t(state.lockLabel)
      });
    }
    if (ui.elements.timerText) {
      const label = state.timerRunning ? "timer" : "timerStopped";
      ui.elements.timerText.textContent = ui.t(label, { time: formatTime(state.timerMs || 0) });
    }
  }

  return {
    update
  };
}
