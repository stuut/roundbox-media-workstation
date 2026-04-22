'use client'
import { useEffect, useRef } from "react";

export default function A4Canvas({ objects, selectedIndex }) {
  const lowerRef = useRef(null);
  const upperRef = useRef(null);

  // A4 ratio (210 × 297 mm)
  const A4_RATIO = 210 / 297;

  useEffect(() => {
    const lowerCanvas = lowerRef.current;
    const upperCanvas = upperRef.current;
    const ctx = upperCanvas.getContext("2d");

    const resize = () => {
      const container = lowerCanvas.parentElement;
      const maxWidth = container.clientWidth;
      const maxHeight = container.clientHeight;

      // fit A4 to container
      let width = maxWidth;
      let height = width / A4_RATIO;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * A4_RATIO;
      }

      // resize canvases
      lowerCanvas.width = width;
      lowerCanvas.height = height;
      upperCanvas.width = width;
      upperCanvas.height = height;

      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, upperCanvas.width, upperCanvas.height);

      // draw all objects
      objects.forEach((obj) => {
        ctx.fillStyle = obj.onPage ? "steelblue" : "lightcoral";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
      });

      // selection
      if (selectedIndex != null) {
        const obj = objects[selectedIndex];
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [objects, selectedIndex]);

  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-200">
      <div className="relative">
        {/* Lower canvas = page */}
        <canvas ref={lowerRef} className="bg-white shadow-md" />

        {/* Upper canvas = overlay */}
        <canvas
          ref={upperRef}
          className="absolute top-0 left-0 pointer-events-none"
        />
      </div>
    </div>
  );
}
