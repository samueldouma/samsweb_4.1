// Module aliases from Matter.js
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

// -----------------------------------------------------------------------------
// Engine + Render
// -----------------------------------------------------------------------------
const engine = Engine.create();
const canvas = document.getElementById("canvas");

const render = Render.create({
  canvas,
  engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    background: "#000",
    wireframes: false,
    pixelRatio: Math.max(1, Math.floor(window.devicePixelRatio || 1)) // crisp on mobile
  }
});

// -----------------------------------------------------------------------------
// Boundaries (keep objects in view)
// -----------------------------------------------------------------------------
let boundaryBodies = [];

function addBoundaries() {
  const thickness = 50;
  const w = window.innerWidth;
  const h = window.innerHeight;
  boundaryBodies = [
    Bodies.rectangle(w / 2, -thickness / 2, w, thickness, { isStatic: true }),
    Bodies.rectangle(w / 2, h + thickness / 2, w, thickness, { isStatic: true }),
    Bodies.rectangle(-thickness / 2, h / 2, thickness, h, { isStatic: true }),
    Bodies.rectangle(w + thickness / 2, h / 2, thickness, h, { isStatic: true })
  ];
  Composite.add(engine.world, boundaryBodies);
}

function removeBoundaries() {
  if (!boundaryBodies.length) return;
  boundaryBodies.forEach(b => Composite.remove(engine.world, b));
  boundaryBodies = [];
}

addBoundaries();

// -----------------------------------------------------------------------------
// Invisible static blocker under the overlay text (so balls don't hide it)
// -----------------------------------------------------------------------------
let centerBody = null;
function addCenterBlocker() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const centerX = w / 2;
  const centerY = h / 2;
  // Width/height scaled a bit for small phones:
  const centerWidth = Math.min(420, Math.max(260, w * 0.6));
  const centerHeight = Math.min(140, Math.max(80, h * 0.18));

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

// -----------------------------------------------------------------------------
// Directory buttons (bouncing circles) with labels + page links
// -----------------------------------------------------------------------------
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
const circleRadius = 80;

directories.forEach((dir) => {
  const circle = Bodies.circle(
    Math.random() * (window.innerWidth - 2 * circleRadius) + circleRadius,
    Math.random() * (window.innerHeight - 2 * circleRadius) + circleRadius,
    circleRadius,
    {
      restitution: 0.9,
      friction: 0.005,
      render: {
        fillStyle: "#fff",
        strokeStyle: "#000",
        lineWidth: 2
      }
    }
  );
  circle.directory = dir;
  circles.push(circle);
});

Composite.add(engine.world, circles);

// -----------------------------------------------------------------------------
// Mouse / Touch (Pointer) support
// -----------------------------------------------------------------------------
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

// --- Tap/Click navigation: fire on both click and pointerup (covers iOS) -----
function handleActivate() {
  const mousePos = mouse.position;
  for (let circle of circles) {
    const dx = mousePos.x - circle.position.x;
    const dy = mousePos.y - circle.position.y;
    if (Math.hypot(dx, dy) <= circleRadius) {
      window.location.href = circle.directory.link;
      return;
    }
  }
}
render.canvas.addEventListener("click", handleActivate, { passive: true });
render.canvas.addEventListener("pointerup", handleActivate, { passive: true });

// -----------------------------------------------------------------------------
// Draw labels on circles after rendering
// -----------------------------------------------------------------------------
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "20px 'Helvetica Neue', Arial, sans-serif";
  circles.forEach((circle) => {
    ctx.fillStyle = "#000";
    ctx.fillText(circle.directory.label, circle.position.x, circle.position.y);
  });
});

// -----------------------------------------------------------------------------
// Run
// -----------------------------------------------------------------------------
Render.run(render);
Runner.run(Runner.create(), engine);

// -----------------------------------------------------------------------------
// Responsive resize: resize canvas, rebuild boundaries + center blocker,
// and keep pixelRatio crisp for mobile
// -----------------------------------------------------------------------------
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  render.canvas.width = w;
  render.canvas.height = h;

  // Keep the internal render options in sync
  render.options.width = w;
  render.options.height = h;

  // Update device pixel ratio for crispness (where supported)
  if (render.context && render.context.setTransform) {
    render.options.pixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  }

  // Rebuild edges and center blocker to fit new size
  removeBoundaries();
  addBoundaries();

  removeCenterBlocker();
  addCenterBlocker();
}

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);
resize(); // initial pass in case layout differs from initial values
