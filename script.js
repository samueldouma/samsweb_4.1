// === Matter.js Setup ===
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

const engine = Engine.create();
const canvas = document.getElementById("canvas");
const render = Render.create({
  canvas,
  engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    background: "#ffffff",
    wireframes: false
  }
});
Matter.Render.setPixelRatio(render, Math.max(1, window.devicePixelRatio || 1));

/* Persistent visual history: only deliberate page visits assign colors. */
const VISITED_KEY = "visitedBubbles_v3";
const COLOR_MAP_KEY = "bubbleColorMap_v1";
const colorPalette = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"];

try {
  const url = new URL(window.location.href);
  if (url.searchParams.get("reset") === "1") {
    localStorage.removeItem(VISITED_KEY);
    localStorage.removeItem(COLOR_MAP_KEY);
  }
} catch (_) {}

function readStoredString(key, fallback) {
  try {
    const localValue = localStorage.getItem(key);
    if (localValue !== null) return localValue;
  } catch (_) {}
  try {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue !== null) return sessionValue;
  } catch (_) {}
  return fallback;
}
function readArray(key) {
  try {
    const value = JSON.parse(readStoredString(key, "[]"));
    return Array.isArray(value) ? value : [];
  } catch (_) { return []; }
}
function readObject(key) {
  try {
    const value = JSON.parse(readStoredString(key, "{}"));
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch (_) { return {}; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (_) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
}

let visited = readArray(VISITED_KEY);
let colorMap = readObject(COLOR_MAP_KEY);

function pickUniqueColor() {
  const used = new Set(Object.values(colorMap));
  const unused = colorPalette.filter((color) => !used.has(color));
  const pool = unused.length ? unused : colorPalette;
  return pool[Math.floor(Math.random() * pool.length)];
}

let migrated = false;
visited.forEach((label) => {
  if (!colorMap[label]) {
    colorMap[label] = pickUniqueColor();
    migrated = true;
  }
});
if (migrated) writeStorage(COLOR_MAP_KEY, colorMap);

/* Boundaries */
let boundaryBodies = [];
function addBoundaries() {
  const t = 50;
  const w = window.innerWidth;
  const h = window.innerHeight;
  boundaryBodies = [
    Bodies.rectangle(w / 2, -t / 2, w, t, { isStatic: true }),
    Bodies.rectangle(w / 2, h + t / 2, w, t, { isStatic: true }),
    Bodies.rectangle(-t / 2, h / 2, t, h, { isStatic: true }),
    Bodies.rectangle(w + t / 2, h / 2, t, h, { isStatic: true })
  ];
  Composite.add(engine.world, boundaryBodies);
}
function removeBoundaries() {
  boundaryBodies.forEach((body) => Composite.remove(engine.world, body));
  boundaryBodies = [];
}
addBoundaries();

const directories = [
  { label: "Audio", link: "audio.html" },
  { label: "Video", link: "video.html" },
  { label: "Disco", link: "disco.html" },
  { label: "Dico", link: "dico.html" },
  { label: "Cogito", link: "cogito.html" },
  { label: "Lego", link: "lego.html" },
  { label: "Scribo", link: "scribo.html" }
];

const circles = [];
const baseRadius = 60;
const minSide = Math.min(window.innerWidth, window.innerHeight);
const circleRadius = Math.round(Math.max(44, Math.min(baseRadius, minSide * 0.08)));

function storedFill(label) {
  return visited.includes(label) && colorMap[label] ? colorMap[label] : "#FFFFFF";
}

directories.forEach((directory) => {
  const circle = Bodies.circle(
    Math.random() * (window.innerWidth - 2 * circleRadius) + circleRadius,
    Math.random() * (window.innerHeight - 2 * circleRadius) + circleRadius,
    circleRadius,
    {
      restitution: 0.9,
      friction: 0.005,
      frictionAir: 0.002,
      render: {
        fillStyle: storedFill(directory.label),
        strokeStyle: "#000000",
        lineWidth: 2
      }
    }
  );
  circle.directory = directory;
  circles.push(circle);
});
Composite.add(engine.world, circles);

const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

function reloadHistory() {
  visited = readArray(VISITED_KEY);
  colorMap = readObject(COLOR_MAP_KEY);
}
function refreshCircleColors() {
  reloadHistory();
  circles.forEach((circle) => {
    circle.render.fillStyle = storedFill(circle.directory.label);
  });
}
function circleAt(x, y) {
  return circles.find((circle) => Math.hypot(x - circle.position.x, y - circle.position.y) <= circleRadius);
}
function recordVisit(circle) {
  const label = circle.directory.label;
  reloadHistory();
  if (!visited.includes(label)) visited.push(label);
  if (!colorMap[label]) colorMap[label] = pickUniqueColor();
  writeStorage(VISITED_KEY, visited);
  writeStorage(COLOR_MAP_KEY, colorMap);
  // Update before navigation so Back/bfcache never shows stale white.
  circle.render.fillStyle = colorMap[label];
}

let pointerStart = null;
render.canvas.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
}, { passive: true });
render.canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (moved > 10) return; // A drag is not a visit.
  const rect = render.canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (window.innerWidth / rect.width);
  const y = (event.clientY - rect.top) * (window.innerHeight / rect.height);
  const circle = circleAt(x, y);
  if (!circle) return;
  recordVisit(circle);
  window.setTimeout(() => window.location.assign(circle.directory.link), 24);
}, { passive: true });
render.canvas.addEventListener("pointercancel", () => { pointerStart = null; }, { passive: true });

// Returning via browser Back often restores the page from bfcache without rerunning this file.
window.addEventListener("pageshow", refreshCircleColors);
window.addEventListener("focus", refreshCircleColors);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshCircleColors();
});
window.addEventListener("storage", refreshCircleColors);

/* Ball and wall collisions never alter color. */
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px 'Helvetica Neue', Arial, sans-serif";
  circles.forEach((circle) => {
    ctx.fillStyle = "#000000";
    ctx.fillText(circle.directory.label, circle.position.x, circle.position.y);
  });
});

Render.run(render);
Runner.run(Runner.create(), engine);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  render.options.width = w;
  render.options.height = h;
  render.canvas.width = w;
  render.canvas.height = h;
  Matter.Render.setPixelRatio(render, Math.max(1, window.devicePixelRatio || 1));
  removeBoundaries();
  addBoundaries();
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize();
