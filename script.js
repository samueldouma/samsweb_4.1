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

// crisp on mobile without scaling the world
Matter.Render.setPixelRatio(render, Math.max(1, window.devicePixelRatio || 1));

/* ------------------------------------------------------------------ *
 * Visited memory + explicit "only color AFTER a click" session flag
 * ------------------------------------------------------------------ */
const VISITED_KEY = "visitedBubbles_v2";
const COLOR_FLAG = "enableVisitedColors_v1";

// Optional reset via URL: ?reset=1
try {
  const u = new URL(window.location.href);
  if (u.searchParams.get("reset") === "1") {
    localStorage.removeItem(VISITED_KEY);
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

const enableVisitedColors = sessionStorage.getItem(COLOR_FLAG) === "1";

/* ---------------------- Colors (indexed palette) ------------------- */
const colorPalette = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#0000FF", // Blue
  "#4B0082", // Indigo
  "#8B00FF"  // Violet
];

// Invert a hex color like #RRGGBB
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

/* -------------------- Directories (bubbles) ------------------------ */
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

directories.forEach((dir, i) => {
  const showColor = enableVisitedColors && visited.includes(dir.label);
  const fillColor = showColor ? colorPalette[i % colorPalette.length] : "#FFFFFF";

  const circle = Bodies.circle(
    Math.random() * (window.innerWidth - 2 * circleRadius) + circleRadius,
    Math.random() * (window.innerHeight - 2 * circleRadius) + circleRadius,
    circleRadius,
    {
      restitution: 0.9,
      friction: 0.005,
      render: {
        fillStyle: fillColor,
        strokeStyle: "#000000",
        lineWidth: 2
      }
    }
  );

  circle.directory = dir;
  circle.originalColor = fillColor;
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

// Click / Tap navigation + mark visited + enable color for future returns
function handleActivate() {
  const mousePos = mouse.position;

  for (let circle of circles) {
    const dx = mousePos.x - circle.position.x;
    const dy = mousePos.y - circle.position.y;

    if (Math.hypot(dx, dy) <= circleRadius) {
      const label = circle.directory.label;

      if (!visited.includes(label)) {
        visited.push(label);
        try {
          localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
        } catch (_) {}
      }

      sessionStorage.setItem(COLOR_FLAG, "1");
      window.location.href = circle.directory.link;
      return;
    }
  }
}

render.canvas.addEventListener("click", handleActivate, { passive: true });
render.canvas.addEventListener("pointerup", handleActivate, { passive: true });

/* ---------------------- Collision color invert --------------------- */
// Prevents rapid flicker from repeated collision frames
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

    // Only react when two directory circles collide with each other
    if (!aIsCircle || !bIsCircle) return;

    const key = pairKey(bodyA.id, bodyB.id);
    const lastTime = collisionCooldown.get(key) || 0;

    if (now - lastTime < COLLISION_COOLDOWN_MS) return;
    collisionCooldown.set(key, now);

    bodyA.render.fillStyle = invertHexColor(bodyA.render.fillStyle);
    bodyB.render.fillStyle = invertHexColor(bodyB.render.fillStyle);
  });
});

/* -------------------------- Labels ------------------------------- */
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px 'Helvetica Neue', Arial, sans-serif";

  circles.forEach((circle) => {
    // make label readable on both light and dark fills
    const fill = circle.render.fillStyle.toUpperCase();
    ctx.fillStyle = fill === "#FFFFFF" || fill === "#FFFF00" ? "#000000" : "#FFFFFF";
    ctx.fillText(circle.directory.label, circle.position.x, circle.position.y);
  });
});

/* --------------------------- Run -------------------------------- */
Render.run(render);
Runner.run(Runner.create(), engine);

/* -------------------------- Resize ------------------------------- */
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
