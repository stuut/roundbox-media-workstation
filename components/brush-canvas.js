'use client'


import React, { useRef, useEffect } from "react";
import { BufferedBrush } from "@/lib/buffered-brush"

export default function BrushCanvas() {
  const mainRef = useRef(null);
  const overlayRef = useRef(null);
  const brushRef = useRef(null);

  useEffect(() => {
    if (!mainRef.current || !overlayRef.current) return;

    // ✅ create brush only once when canvases are mounted
    brushRef.current = new BufferedBrush(mainRef.current, overlayRef.current);

    // optional cleanup (if you add event listeners in class)
    return () => {
      brushRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <canvas
        ref={mainRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,

        }}
      />
      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 40,

        }}
      />
    </div>
  );
}
