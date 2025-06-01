let currentTool = 'line';
let drawing = false;
let startX, startY;
let path = []; // for squiggle

const canvasContainer = document.getElementById('canvas-container');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

const API_URL = 'http://localhost:4000/api/shapes';

document.querySelectorAll('[data-tool]').forEach(btn => {
  btn.onclick = () => currentTool = btn.dataset.tool;
});

document.getElementById('new-tab').onclick = () => {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = 800;
  newCanvas.height = 600;
  newCanvas.id = 'canvas-' + Date.now();
  newCanvas.style.border = '2px solid #ccc';
  canvasContainer.innerHTML = '';
  canvasContainer.appendChild(newCanvas);
  canvas = newCanvas;
  ctx = canvas.getContext('2d');
  attachEvents();
};

function drawShape(shape) {
  ctx.beginPath();
  if (shape.type === 'line') {
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
  } else if (shape.type === 'rect') {
    ctx.rect(shape.x1, shape.y1, shape.x2 - shape.x1, shape.y2 - shape.y1);
  } else if (shape.type === 'circle') {
    const radius = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1);
    ctx.arc(shape.x1, shape.y1, radius, 0, Math.PI * 2);
  } else if (shape.type === 'squiggle') {
    shape.path.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
  }
  ctx.strokeStyle = shape.color || "black";
  ctx.lineWidth = shape.tool === 'erase' ? 20 : 2;
  ctx.stroke();
}

function attachEvents() {
  canvas.onmousedown = (e) => {
    drawing = true;
    [startX, startY] = [e.offsetX, e.offsetY];
    path = [{ x: startX, y: startY }];
  };

  canvas.onmouseup = (e) => {
    if (!drawing) return;
    drawing = false;
    const [x2, y2] = [e.offsetX, e.offsetY];

    let shape;

    if (currentTool === 'squiggle') {
      shape = { type: 'squiggle', path, color: 'black' };
    } else if (currentTool === 'erase') {
      shape = { type: 'squiggle', path, tool: 'erase', color: 'white' };
    } else {
      shape = {
        type: currentTool,
        x1: startX,
        y1: startY,
        x2,
        y2,
        color: 'black'
      };
    }

    drawShape(shape);

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shape)
    }).then(res => res.json());
  };

  canvas.onmousemove = (e) => {
    if (!drawing) return;
    if (currentTool === 'squiggle' || currentTool === 'erase') {
      path.push({ x: e.offsetX, y: e.offsetY });
      ctx.beginPath();
      ctx.moveTo(path[path.length - 2].x, path[path.length - 2].y);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.strokeStyle = currentTool === 'erase' ? 'white' : 'black';
      ctx.lineWidth = currentTool === 'erase' ? 20 : 2;
      ctx.stroke();
    }
  };
}

window.onload = () => {
  fetch(API_URL)
    .then(res => res.json())
    .then(shapes => shapes.forEach(drawShape));
  attachEvents();
};
