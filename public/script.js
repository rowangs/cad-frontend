const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let startX, startY;
let currentTool = 'line';

document.getElementById('draw-line').onclick = () => currentTool = 'line';
document.getElementById('draw-rect').onclick = () => currentTool = 'rect';

const API_URL = 'http://localhost:4000/api/shapes';

function drawShape(shape) {
  ctx.beginPath();
  if (shape.type === 'line') {
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
  } else if (shape.type === 'rect') {
    ctx.rect(shape.x1, shape.y1, shape.x2 - shape.x1, shape.y2 - shape.y1);
  }
  ctx.stroke();
}

canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  [startX, startY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mouseup', (e) => {
  if (!drawing) return;
  drawing = false;

  const endX = e.offsetX;
  const endY = e.offsetY;

  const shape = {
    type: currentTool,
    x1: startX,
    y1: startY,
    x2: endX,
    y2: endY,
    color: "black"
  };

  drawShape(shape); // Draw immediately

  // Send to backend
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shape)
  })
  .then(res => res.json())
  .then(data => console.log('Saved:', data))
  .catch(err => console.error('POST failed:', err));
});

// Load and draw all shapes on load
window.onload = () => {
  fetch(API_URL)
    .then(res => res.json())
    .then(shapes => {
      shapes.forEach(drawShape);
    })
    .catch(err => console.error('GET failed:', err));
};
