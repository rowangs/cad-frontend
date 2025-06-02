window.onload = () => {
  console.log("✅ CAD App Loaded");

  let currentTool = 'line';
  let currentColor = '#000000';
  let strokeSize = 2;
  let currentBoardId = 'default';
  let drawing = false;
  let startX, startY;
  let path = [];

  const undoStacks = {};
  const redoStacks = {};

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const API_URL = 'https://cad-backend.onrender.com/api/shapes';

  const colorPicker = document.getElementById('color-picker');
  const strokeSlider = document.getElementById('stroke-size');
  const tabSelect = document.getElementById('tab-select');
  const newTabButton = document.getElementById('new-tab');

  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.onclick = () => currentTool = btn.dataset.tool;
  });

  colorPicker.oninput = e => currentColor = e.target.value;
  strokeSlider.oninput = e => strokeSize = parseInt(e.target.value);

  newTabButton.onclick = () => {
    const newId = 'board-' + Date.now();
    addTab(newId, true);
    switchBoard(newId);
  };

  tabSelect.onchange = e => switchBoard(e.target.value);

  document.getElementById('clear-board').onclick = () => {
    fetch(`${API_URL}?boardId=${currentBoardId}`, { method: 'DELETE' }).then(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      undoStacks[currentBoardId] = [];
      redoStacks[currentBoardId] = [];
    });
  };

  document.getElementById('undo-btn').onclick = () => {
    const stack = undoStacks[currentBoardId];
    if (!stack || stack.length === 0) return;
    const shape = stack.pop();
    redoStacks[currentBoardId] ||= [];
    redoStacks[currentBoardId].push(shape);

    fetch(`${API_URL}/${shape.id}?boardId=${currentBoardId}`, { method: 'DELETE' })
      .then(() => switchBoard(currentBoardId));
  };

  document.getElementById('redo-btn').onclick = () => {
    const stack = redoStacks[currentBoardId];
    if (!stack || stack.length === 0) return;
    const shape = stack.pop();
    undoStacks[currentBoardId] ||= [];
    undoStacks[currentBoardId].push(shape);

    fetch(`${API_URL}?boardId=${currentBoardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shape)
    }).then(() => drawShape(shape));
  };

  document.getElementById('export-png').onclick = () => {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `${currentBoardId}.png`;
    link.href = image;
    link.click();
  };

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
    const shapeId = Date.now().toString();

    if (currentTool === 'squiggle' || currentTool === 'erase') {
      shape = {
        id: shapeId,
        type: 'squiggle',
        path,
        tool: currentTool,
        color: currentTool === 'erase' ? 'white' : currentColor,
        strokeSize
      };
    } else {
      shape = {
        id: shapeId,
        type: currentTool,
        x1: startX,
        y1: startY,
        x2,
        y2,
        color: currentColor,
        strokeSize
      };
    }

    undoStacks[currentBoardId] ||= [];
    redoStacks[currentBoardId] = [];
    undoStacks[currentBoardId].push(shape);
    drawShape(shape);

    fetch(`${API_URL}?boardId=${currentBoardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shape)
    });
  };

  canvas.onmousemove = (e) => {
    if (!drawing) return;
    if (currentTool === 'squiggle' || currentTool === 'erase') {
      const x = e.offsetX;
      const y = e.offsetY;
      path.push({ x, y });

      ctx.beginPath();
      ctx.moveTo(path[path.length - 2].x, path[path.length - 2].y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = currentTool === 'erase' ? 'white' : currentColor;
      ctx.lineWidth = currentTool === 'erase' ? 20 : strokeSize;
      ctx.stroke();
    }
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
      ctx.arc(shape.x1, shape.y1, radius, 0, 2 * Math.PI);
    } else if (shape.type === 'squiggle') {
      shape.path.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
    }

    ctx.strokeStyle = shape.tool === 'erase' ? 'white' : (shape.color || 'black');
    ctx.lineWidth = shape.tool === 'erase' ? 20 : (shape.strokeSize || 2);
    ctx.stroke();
  }

  function addTab(boardId, select = false) {
    const opt = document.createElement('option');
    opt.value = boardId;
    opt.textContent = boardId;
    tabSelect.appendChild(opt);
    if (select) tabSelect.value = boardId;
  }

  function switchBoard(boardId) {
    currentBoardId = boardId;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    undoStacks[boardId] = [];
    redoStacks[boardId] = [];

    fetch(`${API_URL}?boardId=${boardId}`)
      .then(res => res.json())
      .then(shapes => {
        shapes.forEach(shape => {
          drawShape(shape);
          undoStacks[boardId].push(shape);
        });
      });
  }

  addTab('default', true);
  switchBoard('default');
};
