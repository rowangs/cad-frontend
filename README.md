# 🖌️ Mini CAD App

A browser-based Mini CAD (Computer-Aided Design) app built from scratch with a Node.js backend and HTML5 canvas frontend. It supports drawing lines, rectangles, circles, squiggles, and erasing — along with undo/redo, tabbed boards, and image exporting.

Live Demo: [Mini CAD App](https://rowangs.github.io/cad-frontend/)  
Backend API: [Render Deployment](https://cad-backend-1.onrender.com)

---

## 🌐 Features

### ✏️ Drawing Tools
- Line, Rectangle, Circle, Freehand (Squiggle), Eraser

### 🎨 UI Controls
- Color Picker
- Brush Size Slider
- Undo & Redo
- Clear Board
- Export Canvas as PNG
- Multiple Boards (Tabs)

### 🔁 Data Persistence
- Shape data is saved per board to a Node/Express backend
- Shapes are automatically reloaded when switching boards

---

## 🧠 Tech Stack

| Layer       | Technology                        |
|-------------|------------------------------------|
| Frontend    | HTML, CSS, JavaScript (Vanilla)   |
| Backend     | Node.js, Express.js               |
| Deployment  | GitHub Pages (frontend) + Render (backend) |
| Data Store  | In-memory object per board        |

---

## 🚀 Setup Instructions

### 🔧 Backend (Node.js + Express)

1. Clone backend repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cad-backend
   cd cad-backend
   npm install
   node index.js
