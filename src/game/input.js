export function createInput() {
  const inputState = {
    throttleUp: 0,
    throttleDown: 0,
    yawLeft: 0,
    yawRight: 0,
    pitchUp: 0,
    pitchDown: 0,
    rollLeft: 0,
    rollRight: 0,
    fire: false,
    switchWeapon: false,
    nextTarget: false
  };

  const map = {
    KeyW: ["throttleUp", 1],
    KeyS: ["throttleDown", 1],
    KeyA: ["yawRight", 1],
    KeyD: ["yawLeft", 1],
    Numpad8: ["pitchDown", 1],
    Numpad5: ["pitchUp", 1],
    Numpad4: ["rollLeft", 1],
    Numpad6: ["rollRight", 1]
  };

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      inputState.fire = true;
      return;
    }
    if (event.code === "KeyQ") {
      inputState.nextTarget = true;
      return;
    }
    if (event.code === "KeyE") {
      inputState.switchWeapon = true;
      return;
    }
    const entry = map[event.code];
    if (entry) {
      inputState[entry[0]] = entry[1];
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      inputState.fire = false;
      return;
    }
    if (event.code === "KeyQ") {
      inputState.nextTarget = false;
      return;
    }
    if (event.code === "KeyE") {
      inputState.switchWeapon = false;
      return;
    }
    const entry = map[event.code];
    if (entry) {
      inputState[entry[0]] = 0;
    }
  });

  return inputState;
}
