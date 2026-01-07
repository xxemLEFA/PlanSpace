import "./style.css";
import { initI18n } from "./i18n.js";
import { initGame } from "./game.js";

const ui = initI18n();
const canvas = document.querySelector("#c");

initGame(canvas, ui);
