import { useCallback, useEffect, useRef, useState } from 'react';
import { cx, severityMeta } from '../utils/format.js';

/**
 * Canvas overlay renderer for normalised (0-100) bounding boxes.
 *
 * Design notes:
 *  - The canvas backing store is sized in device pixels (devicePixelRatio) and
 *    CSS-scaled to the image, so boxes stay crisp on HiDPI displays.
 *  - A ResizeObserver redraws on layout changes instead of relying on the
 *    image's load event alone.
 *  - Hit testing uses the same normalised maths as the draw pass, so clicking
 *    a box is always pixel-accurate.
 */
export default function BoundingCanvas({
  imageSrc,
  detectedObjects = [],
  activeObject = null,
  onSelectObject,
  showLabels = true,
  className = ''
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageReady, setImageReady] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!imageSrc) return;

    // The <img> is object-contain inside the container: replicate that letterbox
    // maths so boxes align with the pixels the user actually sees.
    const naturalW = image?.naturalWidth || rect.width;
    const naturalH = image?.naturalHeight || rect.height;
    const scale = Math.min(rect.width / naturalW, rect.height / naturalH);
    const drawW = naturalW * scale;
    const drawH = naturalH * scale;
    const offsetX = (rect.width - drawW) / 2;
    const offsetY = (rect.height - drawH) / 2;

    detectedObjects.forEach((obj, index) => {
      const box = obj.bounding_box;
      if (!box) return;

      const isActive = activeObject === index || activeObject?.object_name === obj.object_name;
      const severity = severityMeta(obj.risk_score ?? 0);
      const x = offsetX + (box.x_min / 100) * drawW;
      const y = offsetY + (box.y_min / 100) * drawH;
      const w = Math.max(((box.x_max - box.x_min) / 100) * drawW, 6);
      const h = Math.max(((box.y_max - box.y_min) / 100) * drawH, 6);

      ctx.save();
      ctx.lineWidth = isActive ? 3 : 1.75;
      ctx.strokeStyle = isActive ? '#38bdf8' : severity.hex;
      ctx.shadowColor = isActive ? 'rgba(56,189,248,0.65)' : 'transparent';
      ctx.shadowBlur = isActive ? 12 : 0;
      ctx.strokeRect(x, y, w, h);

      // Corner ticks make small boxes readable on busy footage.
      if (isActive) {
        ctx.fillStyle = '#38bdf8';
        const tick = Math.min(12, w / 3, h / 3);
        [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(
          ([cx0, cy0, dx, dy]) => {
            ctx.fillRect(dx === 1 ? cx0 : cx0 - tick, dy === 1 ? cy0 : cy0 - 2, tick, 2);
            ctx.fillRect(dx === 1 ? cx0 : cx0 - 2, dy === 1 ? cy0 : cy0 - tick, 2, tick);
          }
        );
      }

      if (showLabels) {
        const label = `${obj.object_name} · ${Math.round(obj.confidence)}%`;
        ctx.font = '600 12px Inter, system-ui, sans-serif';
        const textWidth = ctx.measureText(label).width;
        const padX = 8;
        const boxH = 22;
        const labelY = y - boxH - 2 >= 0 ? y - boxH - 2 : y + 2;

        ctx.fillStyle = isActive ? 'rgba(56,189,248,0.92)' : 'rgba(5,7,13,0.82)';
        roundRect(ctx, x, labelY, textWidth + padX * 2, boxH, 4);
        ctx.fill();

        ctx.strokeStyle = isActive ? 'rgba(56,189,248,0.92)' : severity.hex;
        ctx.lineWidth = 1;
        roundRect(ctx, x, labelY, textWidth + padX * 2, boxH, 4);
        ctx.stroke();

        ctx.fillStyle = isActive ? '#05070d' : '#e2e8f0';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + padX, labelY + boxH / 2 + 0.5);
      }
      ctx.restore();
    });
  }, [imageSrc, detectedObjects, activeObject, showLabels]);

  // Redraw whenever the content or the box changes.
  useEffect(() => {
    draw();
  }, [draw, imageReady]);

  // Redraw on resize / DPR change.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver(() => draw());
    observer.observe(containerRef.current);
    window.addEventListener('resize', draw);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, [draw]);

  const handleClick = (event) => {
    if (!onSelectObject || detectedObjects.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 100;

    const index = detectedObjects.findIndex((obj) => {
      const box = obj.bounding_box;
      if (!box) return false;
      return clickX >= box.x_min && clickX <= box.x_max && clickY >= box.y_min && clickY <= box.y_max;
    });

    if (index >= 0) onSelectObject(detectedObjects[index], index);
  };

  const handleMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((event.clientX - rect.left) / rect.width) * 100;
    const clickY = ((event.clientY - rect.top) / rect.height) * 100;
    const hovering = detectedObjects.some((obj) => {
      const box = obj.bounding_box;
      return (
        box && clickX >= box.x_min && clickX <= box.x_max && clickY >= box.y_min && clickY <= box.y_max
      );
    });
    canvas.style.cursor = hovering ? 'pointer' : 'default';
  };

  return (
    <div
      ref={containerRef}
      className={cx(
        'relative w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80',
        className
      )}
    >
      {imageSrc ? (
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Analysed visual input with detection overlays"
          onLoad={() => setImageReady(true)}
          className="block h-auto max-h-[70vh] w-full object-contain"
          draggable="false"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center text-sm text-slate-500">
          No visual input loaded
        </div>
      )}

      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMove}
        className="absolute left-0 top-0 h-full w-full"
        aria-label="Detection overlay. Click a bounding box to inspect the object."
      />

      {imageSrc && !imageReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/70 text-xs uppercase tracking-widest text-slate-400">
          Decoding frame…
        </div>
      )}
    </div>
  );
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
