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

/* ------------------------------------------------------------------ *
 * Session memory
 * ------------------------------------------------------------------ */
const VISITED_KEY = "visitedBubbles_v3";
const COLOR_FLAG = "enableVisitedColors_v2";
const COLOR_MAP_KEY = "bubbleColorMap_v1";

// Optional reset via URL: ?reset=1
try {
  const u = new URL(window.location.href);
  if (u.searchParams.get("reset") === "1") {
    localStorage.removeItem(VISITED_KEY);
    localStorage.removeItem(COLOR_MAP_KEY);
    sessionStorage.removeItem(COLOR_FLAG);
  }
} catch (_) {}

let visited = [];
try {
  const raw = localStorage.getItem(VISITED_KEY);
  visited = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(visited)) visited = [];
} catch (_) {
  visited = [];
}

let colorMap = {};
try {
  const raw = localStorage.getItem(COLOR_MAP_KEY);
  colorMap = raw ? JSON.parse(raw) : {};
  if (!colorMap || typeof colorMap !== "object" || Array.isArray(colorMap)) {
    colorMap = {};
  }
} catch (_) {
  colorMap = {};
}

// First load in a fresh session = all white.
// After a user clicks a bubble and returns, visited bubbles show stored colors.
const enableVisitedColors = sessionStorage.getItem(COLOR_FLAG) === "1";

/* ---------------------- Colors (unique palette) -------------------- */
const colorPalette = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#0000FF", // Blue
  "#4B0082", // Indigo
  "#8B00FF"  // Violet
];

function getUnusedColors() {
  const used = new Set(Object.values(colorMap));
  return colorPalette.filter(color => !used.has(color));
}

function pickUniqueColor() {
  const unused = getUnusedColors();

  // Until all colors are used, avoid duplicates.
  if (unused.length > 0) {
    return unused[Math.floor(Math.random() * unused.length)];
  }

  // Once all palette colors are used, allow reuse.
  return colorPalette[Math.floor(Math.random() * colorPalette.length)];
}

function saveVisited() {
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
  } catch (_) {}
}

function saveColorMap() {
  try {
    localStorage.setItem(COLOR_MAP_KEY, JSON.stringify(colorMap));
  } catch (_) {}
}

/* --------------------------- Boundaries ---------------------------- */
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
  boundaryBodies.forEach((b) => Composite.remove(engine.world, b));
  boundaryBodies = [];
}

addBoundaries();

/* ----------------------- Directories / bubbles --------------------- */
const directories = [
  { label: "Audio",  link: "audio.html"  },
  { label: "Video",  link: "video.html"  },
  { label: "Disco",  link: "disco.html"  },
  { label: "Dico",   link: "dico.html"   },
  { label: "Cogito", link: "cogito.html" },
  { label: "Lego",   link: "lego.html"   },
  { label: "Scribo", link: "scribo.html" }
];

const circles = [];
const baseRadius = 60;
const minSide = Math.min(window.innerWidth, window.innerHeight);
const circleRadius = Math.round(Math.max(44, Math.min(baseRadius, minSide * 0.08)));

directories.forEach((dir) => {
  const showColor = enableVisitedColors && visited.includes(dir.label);
  const storedColor = colorMap[dir.label];
  const fillColor = showColor && storedColor ? storedColor : "#FFFFFF";

  const circle = Bodies.circle(
    Math.random() * (window.innerWidth - 2 * circleRadius) + circleRadius,
    Math.random() * (window.innerHeight - 2 * circleRadius) + circleRadius,
    circleRadius,
    {
      restitution: 0.9,
      friction: 0.005,
      frictionAir: 0.002,
      render: {
        fillStyle: fillColor,
        strokeStyle: "#000000",
        lineWidth: 2
      }
    }
  );

  circle.directory = dir;
  circles.push(circle);
});

Composite.add(engine.world, circles);

/* -------------------- Mouse / Touch controls ----------------------- */
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.2, render: { visible: false } }
});

Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

function handleActivate() {
  const mousePos = mouse.position;

  for (const circle of circles) {
    const dx = mousePos.x - circle.position.x;
    const dy = mousePos.y - circle.position.y;

    if (Math.hypot(dx, dy) <= circleRadius) {
      const label = circle.directory.label;

      // Mark visited once
      if (!visited.includes(label)) {
        visited.push(label);
        saveVisited();
      }

      // Assign this specific bubble a persistent unique color once
      if (!colorMap[label]) {
        colorMap[label] = pickUniqueColor();
        saveColorMap();
      }

      // Enable showing visited colors when user returns to homepage in this session
      sessionStorage.setItem(COLOR_FLAG, "1");

      window.location.href = circle.directory.link;
      return;
    }
  }
}

render.canvas.addEventListener("click", handleActivate, { passive: true });
render.canvas.addEventListener("pointerup", handleActivate, { passive: true });

/* ---------------- Collision-based temporary color inversion -------- */
// You said the flickering grew on you, so this stays.
// It affects live display during collisions, but persistent visited colors
// still come only from actual clicked pages.

function invertHexColor(hex) {
  const clean = hex.replace("#", "");
  const r = 255 - parseInt(clean.slice(0, 2), 16);
  const g = 255 - parseInt(clean.slice(2, 4), 16);
  const b = 255 - parseInt(clean.slice(4, 6), 16);

  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  ).toUpperCase();
}

const collisionCooldown = new Map();
const COLLISION_COOLDOWN_MS = 180;

function pairKey(idA, idB) {
  return idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
}

Events.on(engine, "collisionStart", (event) => {
  const now = Date.now();

  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;

    const aIsCircle = circles.includes(bodyA);
    const bIsCircle = circles.includes(bodyB);

    if (!aIsCircle || !bIsCircle) return;

    const key = pairKey(bodyA.id, bodyB.id);
    const lastTime = collisionCooldown.get(key) || 0;

    if (now - lastTime < COLLISION_COOLDOWN_MS) return;
    collisionCooldown.set(key, now);

    bodyA.render.fillStyle = invertHexColor(bodyA.render.fillStyle);
    bodyB.render.fillStyle = invertHexColor(bodyB.render.fillStyle);
  });
});

/* -------------------------- Labels -------------------------------- */
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px 'Helvetica Neue', Arial, sans-serif";

  circles.forEach((circle) => {
    const fill = circle.render.fillStyle.toUpperCase();
    ctx.fillStyle = fill === "#FFFFFF" || fill === "#FFFF00" ? "#000000" : "#000000";
    ctx.fillText(circle.directory.label, circle.position.x, circle.position.y);
  });
});

/* --------------------------- Run ---------------------------------- */
Render.run(render);
Runner.run(Runner.create(), engine);

/* -------------------------- Resize -------------------------------- */
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
