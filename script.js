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
    background: "#ffffff", // white homepage
    wireframes: false
  }
});

// crisp on mobile without scaling the world
Matter.Render.setPixelRatio(render, Math.max(1, window.devicePixelRatio || 1));

/* ------------------------------------------------------------------ *
 * Visited memory + explicit "only color AFTER a click" session flag
 * ------------------------------------------------------------------ */
const VISITED_KEY = "visitedBubbles_v2";
const COLOR_FLAG  = "enableVisitedColors_v1"; // set to "1" only when user clicks a bubble

// Optional nukes via URL: ?reset=1 clears everything
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

// IMPORTANT: We DO NOT show colors unless this session flag is set.
// First load -> flag not set -> all bubbles white.
// After user clicks a bubble (before navigation) -> we set the flag.
// Returning to this page -> flag present -> show colored visited bubbles.
const enableVisitedColors = sessionStorage.getItem(COLOR_FLAG) === "1";

/* ---------------------- Strong primary color palette ------------------- */
/* Evenly spaced, fully saturated around the spectrum */
const colorPalette = [
  "#FF0000", // Red
  "#FF7F00", // Orange
  "#FFFF00", // Yellow
  "#00FF00", // Green
  "#0000FF", // Blue
  "#4B0082", // Indigo
  "#8B00FF"  // Violet
];

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
  boundaryBodies.forEach(b => Composite.remove(engine.world, b));
  boundaryBodies = [];
}
addBoundaries();

/* --------------- Invisible blocker behind title/subnav ------------- */
let centerBody = null;
function addCenterBlocker() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const centerX = w / 2;
  const centerY = h / 2;
  const centerWidth  = Math.min(420, Math.max(240, w * 0.56));
  const centerHeight = Math.min(140, Math.max(80,  h * 0.16));

  centerBody = Bodies.rectangle(centerX, centerY, centerWidth, centerHeight, {
    isStatic: true,
    render: { visible: false }
  });
  Composite.add(engine.world, centerBody);
}
function removeCenterBlocker() {
  if (centerBody) {
    Composite.remove(engine.world, centerBody);
    centerBody = null;
  }
}
addCenterBlocker();

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
  // Only show color if this session was "enabled" by a user click
  const showColor = enableVisitedColors && visited.includes(dir.label);
  const fillColor = showColor ? colorPalette[i % colorPalette.length] : "#ffffff";

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

      // Persist visited
      if (!visited.includes(label)) {
        visited.push(label);
        try { localStorage.setItem(VISITED_KEY, JSON.stringify(visited)); } catch (_) {}
      }

      // Enable coloring on future loads in THIS session
      sessionStorage.setItem(COLOR_FLAG, "1");

      // Navigate
      window.location.href = circle.directory.link;
      return;
    }
  }
}
render.canvas.addEventListener("click", handleActivate, { passive: true });
render.canvas.addEventListener("pointerup", handleActivate, { passive: true });

/* -------------------------- Labels ------------------------------- */
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px 'Helvetica Neue', Arial, sans-serif";
  ctx.fillStyle = "#000000";
  circles.forEach(circle => {
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
  removeCenterBlocker();
  addCenterBlocker();
}

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize();
