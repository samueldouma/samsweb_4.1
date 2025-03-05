// Module aliases from Matter.js
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events, Query } = Matter;

// Create engine and renderer
const engine = Engine.create();
const canvas = document.getElementById("canvas");
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    background: "#fff", // White background
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

// Function to generate a random color
function getRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}

// Retrieve stored colors from sessionStorage
const storedColors = JSON.parse(sessionStorage.getItem("clickedBallColors") || "{}");

// Directory buttons (bouncing circles) with labels and page links
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
const circleRadius = 80;

directories.forEach((dir, index) => {
  const color = storedColors[dir.label] || "#fff"; // Default white if not clicked
  const circle = Bodies.circle(
    Math.random() * (window.innerWidth - 2 * circleRadius) + circleRadius,
    Math.random() * (window.innerHeight - 2 * circleRadius) + circleRadius,
    circleRadius,
    {
      restitution: 0.9,
      friction: 0.005,
      render: { fillStyle: color, strokeStyle: "#000", lineWidth: 2 }
    }
  );
  circle.directory = dir;
  circle.index = index; // Store index for lookup
  circles.push(circle);
});
Composite.add(engine.world, circles);

// Add mouse control for dragging
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: { stiffness: 0.2, render: { visible: false } }
});
Composite.add(engine.world, mouseConstraint);
render.mouse = mouse;

// On canvas click, check for a clicked circle, navigate, and update color
render.canvas.addEventListener("click", () => {
  const mousePos = mouse.position;
  for (let circle of circles) {
    const dx = mousePos.x - circle.position.x;
    const dy = mousePos.y - circle.position.y;
    if (Math.sqrt(dx * dx + dy * dy) <= circleRadius) {
      // Change the color permanently for the session
      const newColor = getRandomColor();
      circle.render.fillStyle = newColor;
      storedColors[circle.directory.label] = newColor;
      sessionStorage.setItem("clickedBallColors", JSON.stringify(storedColors));

      // Navigate to the linked page
      window.location.href = circle.directory.link;
      break;
    }
  }
});

// Touch event handling for mobile navigation
render.canvas.addEventListener('touchstart', (event) => {
  event.preventDefault();
  const touch = event.touches[0];
  const mousePos = {
    x: touch.clientX,
    y: touch.clientY
  };
  
  for (let circle of circles) {
    const dx = mousePos.x - circle.position.x;
    const dy = mousePos.y - circle.position.y;
    if (Math.sqrt(dx * dx + dy * dy) <= circleRadius) {
      // Change the color permanently for the session
      const newColor = getRandomColor();
      circle.render.fillStyle = newColor;
      storedColors[circle.directory.label] = newColor;
      sessionStorage.setItem("clickedBallColors", JSON.stringify(storedColors));

      // Navigate to the linked page
      window.location.href = circle.directory.link;
      break;
    }
  }
}, { passive: false });

// Prevent default touch behaviors that might interfere with Matter.js
document.body.addEventListener('touchmove', (event) => {
  event.preventDefault();
}, { passive: false });

// Draw labels on the circles
Events.on(render, "afterRender", () => {
  const context = render.context;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "20px 'Helvetica Neue'";
  context.lineWidth = 1;
  context.strokeStyle = "#000";
  circles.forEach((circle) => {
    context.strokeText(circle.directory.label, circle.position.x, circle.position.y);
  });
});

Render.run(render);
Runner.run(Runner.create(), engine);

window.addEventListener("resize", () => {
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
});
