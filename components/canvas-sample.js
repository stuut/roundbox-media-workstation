"use client"


import React, { useRef, useEffect, useState } from "react";

const W = 640;
const H = 360;

export default function VideoCanvasDemo() {
  const canvasRef = useRef(null);
  const backBufferRef = useRef(null);
  const objectsRef = useRef([]);
  const seekIdRef = useRef(0);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Back buffer
    const back = document.createElement("canvas");
    back.width = W;
    back.height = H;
    backBufferRef.current = back;

    // Video object
    const video = document.createElement("video");
    video.src =
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    const videoObject = {
      id: "video1",
      type: "video",
      video,
      currentTime: 0,
      draw(ctx) {
        ctx.drawImage(this.video, 0, 0, W, H);
      }
    };

    // Rect object
    const rectObject = {
      id: "rect1",
      type: "rect",
      currentTime: 0,
      draw(ctx) {
        ctx.fillStyle = "rgba(255,0,0,0.5)";
        ctx.fillRect(50, 50, 120, 120);
      }
    };

    objectsRef.current = [videoObject, rectObject];

    video.addEventListener("loadedmetadata", () => {
      video.pause();
      video.currentTime = 0;
      video.requestVideoFrameCallback(() => {
        renderAllObjects();
      });
    });
  }, []);

  // 🔑 Single render pass
  const renderAllObjects = () => {
    const backCtx = backBufferRef.current.getContext("2d");

    // Clear ONCE
    backCtx.setTransform(1, 0, 0, 1, 0, 0);
    backCtx.clearRect(0, 0, W, H);

    // Background
    backCtx.fillStyle = "#222";
    backCtx.fillRect(0, 0, W, H);

    // 🔑 Draw in order
    objectsRef.current.forEach((obj) => {
      obj.draw(backCtx);
    });

    // Present
    const ctx = canvasRef.current.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(backBufferRef.current, 0, 0);
  };

  // 🔑 Seek ONLY video, render EVERYTHING after
  const handleScrub = (e) => {
    const value = parseFloat(e.target.value);
    setProgress(value);

    const videoObj = objectsRef.current.find(o => o.type === "video");
    if (!videoObj || !videoObj.video.duration) return;

    const video = videoObj.video;
    video.pause();

    const mySeekId = ++seekIdRef.current;
    const seekTime = Math.min(
      Math.max(value * video.duration, 0),
      video.duration - 0.001
    );

    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);

      video.requestVideoFrameCallback(() => {
        if (mySeekId !== seekIdRef.current) return;

        // Update all object times
        objectsRef.current.forEach(obj => {
          obj.currentTime = value;
        });

        renderAllObjects();
      });
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = seekTime;
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ border: "1px solid #444" }}
      />
      <input
        type="range"
        min="0"
        max="1"
        step="0.001"
        value={progress}
        onChange={handleScrub}
        style={{ width: W }}
      />
    </div>
  );
}
