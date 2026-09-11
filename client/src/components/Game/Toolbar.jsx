import React from 'react';
import { SOCKET_EVENTS } from '../../constants/events';

const PALETTE = [
  '#000000', // Black
  '#ffffff', // White / Eraser
  '#64748b', // Slate Gray
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#854d0e'  // Brown
];

const BRUSH_SIZES = [
  { size: 3, label: 'S' },
  { size: 8, label: 'M' },
  { size: 16, label: 'L' },
  { size: 28, label: 'XL' }
];

export function Toolbar({ socket, activeColor, setActiveColor, activeBrushSize, setActiveBrushSize }) {
  const handleUndo = () => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.DRAW_UNDO);
    }
  };

  const handleClear = () => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.CANVAS_CLEAR);
    }
  };

  return (
    <div className="toolbar">
      {/* Colors */}
      <div className="palette">
        {PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${activeColor === color ? 'active' : ''}`}
            style={{ backgroundColor: color }}
            title={color === '#ffffff' ? 'Eraser (White)' : color}
            onClick={() => setActiveColor(color)}
          />
        ))}
      </div>

      {/* Brush Sizes */}
      <div className="brush-sizes">
        {BRUSH_SIZES.map(({ size, label }) => (
          <button
            key={size}
            type="button"
            className={`brush-size-btn ${activeBrushSize === size ? 'active' : ''}`}
            title={`Size: ${label}`}
            onClick={() => setActiveBrushSize(size)}
          >
            <div
              className="brush-dot"
              style={{
                width: Math.min(20, Math.max(4, size)),
                height: Math.min(20, Math.max(4, size))
              }}
            />
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="tool-actions">
        <button type="button" className="btn-tool" onClick={handleUndo} title="Undo stroke">
          ↩ Undo
        </button>
        <button type="button" className="btn-tool" onClick={handleClear} title="Clear canvas">
          🗑 Clear
        </button>
      </div>
    </div>
  );
}
