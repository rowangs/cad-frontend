window.onload = () => {
  console.log("✅ CAD App Loaded");

  let currentTool = 'line';
  let currentColor = '#000000';
  let currentBoardId = 'default';
  let drawing = false;
  let startX, startY;
  let path = [];
  let undoStack = [];
  let redoStack = [];
  let strokeSize = 2;

  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const API_URL = 'https://cad-backend.onrender.com/api/shapes';

  const colorPicker = document.getElementById('color-picker');
  const tabSelect = document.getElementById('tab-select');
  const newTabButton = document.getElementById('new-tab');
  const strokeSlider = document.getElementById('stroke-size');
  const clearBtn = document.getElementById('clear-board');

  document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.onclick = () => currentTool = btn.dataset.tool;
  });

  colorPicker.onchange = (e) => {
    currentColor = e.target.value;
  };

  strokeSlider.oninput = (e) => {
    strokeSize = parseInt(e.target.value);
  };

  newTabButton.onclick = () => {
    const boardId = 'board-' + Date.now();
    addTab(boardId, true);
    switchBoard(boardId);
  };

  tabSelect.onchange = (e) => {
    switchBoard(e.target.value);
  };

  clearBtn.onclick = () => {
    fetch(`${API_URL}?boardId=${currentBoardId}`, {
      method: 'DELETE'
    }).then(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      undoStack = [];
      redoStack = [];
    });
  };

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
    undoStack = [];
    redoStack = [];

    fetch(`${API_URL}?boardId=${boardId}`)
      .then(res => res.json())
      .then(shapes => {
        shapes.forEach(shape => {
          drawShape(shape);
          undoStack.push(shape);
        });
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
        type: 'squiggle',
        path,
        tool: currentTool,
        color: currentTool === 'erase' ? 'white' : currentColor,
        strokeSize
      };
    } else {
      shape = {
        type: currentTool,
        x1: startX,
        y1: startY,
        x2,
        y2,
        color: currentColor,
        strokeSize
      };
    }

    drawShape(shape);
    undoStack.push(shape);
    redoStack = [];

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

  document.getElementById('undo-btn').onclick = () => {
    if (undoStack.length === 0) return;

    const shape = undoStack.pop();
    redoStack.push(shape);

    fetch(`${API_URL}/${shape.id}?boardId=${currentBoardId}`, {
      method: 'DELETE'
    }).then(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      fetch(`${API_URL}?boardId=${currentBoardId}`)
        .then(res => res.json())
        .then(shapes => {
          shapes.forEach(drawShape);
        });
    });
  };

  document.getElementById('redo-btn').onclick = () => {
    if (redoStack.length === 0) return;

    const shape = redoStack.pop();
    undoStack.push(shape);

    fetch(`${API_URL}?boardId=${currentBoardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shape)
    }).then(() => {
      drawShape(shape);
    });
  };

  document.getElementById('export-png').onclick = () => {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = `${currentBoardId}.png`;
    link.href = image;
    link.click();
  };

  addTab('default', true);
  switchBoard('default');
};
