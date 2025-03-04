// script.js

// Matter.js module aliases
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

// Create engine and renderer
const engine = Engine.create();
const canvas = document.getElementById("canvas");
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    background: "#fff",  // White background
    wireframes: false,
    pixelRatio: window.devicePixelRatio
  }
});

// Create boundaries
function createBoundaries() {
  const thickness = 50;
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  const boundaries = [
    Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true }),
    Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true }),
    Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true }),
    Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true })
  ];
  Composite.add(engine.world, boundaries);
}
createBoundaries();

// Invisible center body for collisions (where "Samuel Douma" text is)
const centerX = window.innerWidth / 2;
const centerY = window.innerHeight / 2;
const centerBody = Bodies.rectangle(centerX, centerY, 400, 100, {
  isStatic: true,
  render: { visible: false }
});
Composite.add(engine.world, centerBody);

// Directory circles with labels + links
const directories = [
  { label: "Audio", link: "audio.html" },
  { label: "Video", link: "video.html" },
  { label: "Disco", link: "disco.html" },
  { label: "Dico", link: "dico.html" },
  { label: "Cogito", link: "cogito.html" },
  { label: "Lego",  link: "lego.html" },
  { label: "Scribo", link: "scribo.html" }
];

const circles = [];
const circleRadius = 80;

directories.forEach(dir => {
  const circle = Bodies.circle(
    Math.random() * (window.innerWidth - 2 * circleRadius) + circleRadius,
    Math.random() * (window.innerHeight - 2 * circleRadius) + circleRadius,
    circleRadius,
    {
      restitution: 0.9,
      friction: 0.005,
      render: {
        fillStyle: "#fff",    // White circle fill
        strokeStyle: "#000",  // Black stroke
        lineWidth: 1
      }
    }
  );
  circle.directory = dir;
  circles.push(circle);
});
Composite.add(engine.world, circles);

// Mouse control for dragging
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

// On canvas click, check if a circle was clicked
render.canvas.addEventListener("click", () => {
  const mousePos = mouse.position;
  for (let circle of circles) {
    const dx = mousePos.x - circle.position.x;
    const dy = mousePos.y - circle.position.y;
    if (Math.sqrt(dx*dx + dy*dy) <= circleRadius) {
      window.location.href = circle.directory.link;
      break;
    }
  }
});

// Draw text labels on circles
Events.on(render, "afterRender", () => {
  const context = render.context;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "20px 'Helvetica Neue'";
  context.fillStyle = "#000"; // Black text on white circles
  circles.forEach(circle => {
    context.fillText(circle.directory.label, circle.position.x, circle.position.y);
  });
});

// Run Matter.js
Render.run(render);
Runner.run(Runner.create(), engine);

// Adjust canvas on resize
window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
});
