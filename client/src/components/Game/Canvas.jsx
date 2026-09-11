import React, { useRef, useEffect, useCallback } from 'react';
import { SOCKET_EVENTS } from '../../constants/events';

// Fixed internal resolution for consistent drawing across different screen sizes
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function Canvas({ socket, isDrawer, activeColor, activeBrushSize }) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const pendingMovesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const strokesHistoryRef = useRef([]);

  // Bug 8 fix: Store color/brushSize in refs so flushMoves always reads the
  // latest values without stale closures inside requestAnimationFrame callbacks.
  const activeColorRef = useRef(activeColor);
  const activeBrushSizeRef = useRef(activeBrushSize);
  useEffect(() => { activeColorRef.current = activeColor; }, [activeColor]);
  useEffect(() => { activeBrushSizeRef.current = activeBrushSize; }, [activeBrushSize]);

  // Clear canvas surface
  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Redraw all strokes in history
  const redrawAllStrokes = useCallback((strokes) => {
    clearLocalCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    strokes.forEach((stroke) => {
      renderStroke(ctx, stroke);
    });
  }, [clearLocalCanvas]);

  // Render a single stroke action on context
  const renderStroke = (ctx, stroke) => {
    if (stroke.type === 'start') {
      ctx.strokeStyle = stroke.color || '#000000';
      ctx.fillStyle = stroke.color || '#000000';
      ctx.lineWidth = stroke.size || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
      // Small dot for single click
      ctx.arc(stroke.x, stroke.y, (stroke.size || 4) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(stroke.x, stroke.y);
    } else if (stroke.type === 'move') {
      ctx.strokeStyle = stroke.color || ctx.strokeStyle;
      ctx.lineWidth = stroke.size || ctx.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points && stroke.points.length > 0) {
        stroke.points.forEach((pt) => {
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
        });
      } else if (stroke.x !== undefined && stroke.y !== undefined) {
        ctx.lineTo(stroke.x, stroke.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(stroke.x, stroke.y);
      }
    } else if (stroke.type === 'end') {
      ctx.beginPath();
    }
  };

  // Listen to remote socket drawing events
  useEffect(() => {
    if (!socket) return;

    const onDrawData = (stroke) => {
      strokesHistoryRef.current.push(stroke);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      renderStroke(ctx, stroke);
    };

    const onStrokeHistory = (data) => {
      strokesHistoryRef.current = data.strokes || [];
      redrawAllStrokes(strokesHistoryRef.current);
    };

    const onCanvasUndo = (data) => {
      strokesHistoryRef.current = data.strokes || [];
      redrawAllStrokes(strokesHistoryRef.current);
    };

    const onCanvasCleared = () => {
      strokesHistoryRef.current = [];
      clearLocalCanvas();
    };

    socket.on(SOCKET_EVENTS.DRAW_DATA, onDrawData);
    socket.on(SOCKET_EVENTS.STROKE_HISTORY, onStrokeHistory);
    socket.on(SOCKET_EVENTS.CANVAS_UNDO, onCanvasUndo);
    socket.on(SOCKET_EVENTS.CANVAS_CLEARED, onCanvasCleared);

    return () => {
      socket.off(SOCKET_EVENTS.DRAW_DATA, onDrawData);
      socket.off(SOCKET_EVENTS.STROKE_HISTORY, onStrokeHistory);
      socket.off(SOCKET_EVENTS.CANVAS_UNDO, onCanvasUndo);
      socket.off(SOCKET_EVENTS.CANVAS_CLEARED, onCanvasCleared);
    };
  }, [socket, redrawAllStrokes, clearLocalCanvas]);

  // Bug 8 fix: flushMoves reads from refs — always uses latest color/size
  // even if they changed between rAF scheduling and execution.
  const flushMoves = useCallback(() => {
    if (pendingMovesRef.current.length > 0 && socket) {
      socket.emit(SOCKET_EVENTS.DRAW_MOVE, {
        points: [...pendingMovesRef.current],
        color: activeColorRef.current,
        size: activeBrushSizeRef.current
      });
      pendingMovesRef.current = [];
    }
    animationFrameRef.current = null;
  }, [socket]);

  // Bug 1 fix: getCanvasCoords uses getBoundingClientRect() which always
  // reflects the actual rendered pixel size of the canvas element.
  // Combined with the aspect-ratio CSS on the parent, the scale factors
  // are always correct and cursor position matches drawn position.
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY)
    };
  };

  // Pointer Handlers (only active if isDrawer is true)
  const handlePointerDown = (e) => {
    if (!isDrawer) return;
    isDrawingRef.current = true;
    e.target.setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e);

    socket.emit(SOCKET_EVENTS.DRAW_START, {
      x,
      y,
      color: activeColorRef.current,
      size: activeBrushSizeRef.current
    });
  };

  const handlePointerMove = (e) => {
    if (!isDrawer || !isDrawingRef.current) return;

    const { x, y } = getCanvasCoords(e);
    pendingMovesRef.current.push({ x, y });

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(flushMoves);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch (_) {}

    // Flush any remaining moves before emitting end
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    flushMoves();

    socket.emit(SOCKET_EVENTS.DRAW_END, {});
  };

  // Initialize canvas on mount
  useEffect(() => {
    clearLocalCanvas();
  }, [clearLocalCanvas]);

  return (
    <div className="canvas-surface-wrap">
      {/*
        canvas-surface-wrap is position:relative; flex:1 (see index.css).
        This canvas is position:absolute; top:0; left:0; width:100%; height:100%
        so it fills the entire white drawing area without gaps.
        getBoundingClientRect() in getCanvasCoords() always reads the actual
        rendered pixel dimensions so coordinate mapping is always accurate.
        cursor is set here (not on the parent) so only the drawer gets crosshair.
      */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="canvas-surface"
        style={{
          cursor: isDrawer ? 'crosshair' : 'default'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
