window.onload = () => {
  console.log("✅ CAD + Backend loaded");

  let currentTool = 'line';
  let currentColor = '#000000';
  let currentBoardId = 'default';
  let lineWidth = 2;
  let drawing = false;
  let startX, startY;
  let path = [];

  const undoStacks = {};
  const redoStacks = {};

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const API_URL = 'https://cad-backend-1.onrender.com/api/shapes';

  const colorPicker = document.getElementById('color-picker');
  const tabSelect = document.getElementById('tab-select');
  const newTabButton = document.getElementById('new-tab');
  const clearButton = document.getElementById('clear-board');
  const exportButton = document.getElementById('export-png');
  const strokeSlider = document.getElementById('stroke-slider');
  const undoButton = document.getElementById('undo-btn');
  const redoButton = document.getElementById('redo-btn');

  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.onclick = () => currentTool = btn.dataset.tool;
  });

  colorPicker.onchange = (e) => currentColor = e.target.value;
  strokeSlider.oninput = (e) => lineWidth = parseInt(e.target.value);

  newTabButton.onclick = () => {
    const boardId = 'board-' + Date.now();
    addTab(boardId, true);
    switchBoard(boardId);
  };

  tabSelect.onchange = (e) => switchBoard(e.target.value);

  clearButton.onclick = () => {
    fetch(`${API_URL}?boardId=${currentBoardId}`, { method: 'DELETE' }).then(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      undoStacks[currentBoardId] = [];
      redoStacks[currentBoardId] = [];
    });
  };

  exportButton.onclick = () => {
    const link = document.createElement('a');
    link.download = `${currentBoardId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  undoButton.onclick = () => {
    const stack = undoStacks[currentBoardId];
    if (!stack || stack.length === 0) return;

    const shape = stack.pop();
    redoStacks[currentBoardId].push(shape);

    fetch(`${API_URL}/${shape.id}?boardId=${currentBoardId}`, {
      method: 'DELETE'
    }).then(() => switchBoard(currentBoardId));
  };

  redoButton.onclick = () => {
    const stack = redoStacks[currentBoardId];
    if (!stack || stack.length === 0) return;

    const oldShape = stack.pop();
    const newShape = { ...oldShape, id: Date.now().toString() }; // assign new ID
    undoStacks[currentBoardId].push(newShape);

    fetch(`${API_URL}?boardId=${currentBoardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newShape)
    }).then(() => drawShape(newShape));
  };

  function addTab(boardId, select = false) {
    const opt = document.createElement('option');
    opt.value = boardId;
    opt.textContent = boardId;
    tabSelect.appendChild(opt);
    if (select) tabSelect.value = boardId;
    undoStacks[boardId] = [];
    redoStacks[boardId] = [];
  }

  function switchBoard(boardId) {
    currentBoardId = boardId;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    fetch(`${API_URL}?boardId=${boardId}`)
      .then(res => res.json())
      .then(shapes => {
        undoStacks[boardId] = [...shapes];
        redoStacks[boardId] = [];
        shapes.forEach(drawShape);
      });
  }

  canvas.onmousedown = (e) => {
    drawing = true;
    [startX, startY] = [e.offsetX, e.offsetY];
    path = [{ x: startX, y: startY }];
  };

  canvas.onmouseup = (e) => {
    if (!drawing) return;
    drawing = false;

    const x2 = e.offsetX;
    const y2 = e.offsetY;

    let shape;
    if (currentTool === 'squiggle' || currentTool === 'erase') {
      shape = {
        id: Date.now().toString(),
        type: 'squiggle',
        path,
        tool: currentTool,
        color: currentTool === 'erase' ? 'white' : currentColor,
        width: currentTool === 'erase' ? 20 : lineWidth
      };
    } else {
      shape = {
        id: Date.now().toString(),
        type: currentTool,
        x1: startX,
        y1: startY,
        x2,
        y2,
        color: currentColor,
        width: lineWidth
      };
    }

    fetch(`${API_URL}?boardId=${currentBoardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shape)
    }).then(() => {
      drawShape(shape);
      undoStacks[currentBoardId].push(shape);
      redoStacks[currentBoardId] = [];
    });
  };

  canvas.onmousemove = (e) => {
    if (!drawing || (currentTool !== 'squiggle' && currentTool !== 'erase')) return;
    const x = e.offsetX, y = e.offsetY;
    path.push({ x, y });

    ctx.beginPath();
    ctx.moveTo(path[path.length - 2].x, path[path.length - 2].y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentTool === 'erase' ? 'white' : currentColor;
    ctx.lineWidth = currentTool === 'erase' ? 20 : lineWidth;
    ctx.stroke();
  };

  function drawShape(shape) {
    ctx.beginPath();
    ctx.lineWidth = shape.width || 2;

    if (shape.type === 'line') {
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
    } else if (shape.type === 'rect') {
      ctx.rect(shape.x1, shape.y1, shape.x2 - shape.x1, shape.y2 - shape.y1);
    } else if (shape.type === 'circle') {
      const r = Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1);
      ctx.arc(shape.x1, shape.y1, r, 0, 2 * Math.PI);
    } else if (shape.type === 'squiggle') {
      shape.path.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
    }

    ctx.strokeStyle = shape.tool === 'erase' ? 'white' : (shape.color || 'black');
    ctx.stroke();
  }

  // ✅ Initialize default tab
  addTab('default', true);
  switchBoard('default');
};
// The above code initializes a simple CAD-like application with a canvas for drawing shapes.
// It supports multiple tools (line, rectangle, circle, squiggle, erase), color selection, undo/redo functionality,
// and the ability to create multiple boards (tabs) that can be switched between.
//   ctx.lineWidth = shape.width || 2;
//     ctx.strokeStyle = shape.tool === 'erase' ? 'white' : (shape.color || 'black');
//     ctx.stroke();