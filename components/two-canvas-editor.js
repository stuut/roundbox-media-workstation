'use client';
import React, { useRef, useState, useEffect } from "react";
import { SketchPicker } from 'react-color';

const HANDLE_SIZE = 20;

// A4 @ 300 DPI
const PAGE_WIDTH = 2480;
const PAGE_HEIGHT = 3508;

// bigger artboard
const ARTBOARD_WIDTH = 5000;
const ARTBOARD_HEIGHT = 5000;



export const TwoCanvasArtboard = () => {
  const lowerRef = useRef(null);
  const upperRef = useRef(null);

  const objectsRef = useRef([]);
  const [artboardSize, setArtboardSize] = useState({w:2000,h:2000})

  const [scale, setScale] = useState(0.3);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [objects, setObjects] = useState([
    { x: 100, y: 100, w: 300, h: 200, onPage: true },
    { x: 3000, y: 4000, w: 200, h: 200, onPage: true }, // off-page
  ]);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const newElement = (pos, type, shapeType, fill) => {
    return{
      id: objectsRef.current.length+1,
      cx: pos.x,
      cy: pos.x,
      w: 0,
      h: 0,
      angle: 0, // no rotation when created
      type: type,
      radius:0,
      shapeType:shapeType,
      fill: fill
    }
  }

  const resizeWindow = () => {
    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.8;


    const ratio = Math.min(width / ARTBOARD_WIDTH, height / ARTBOARD_HEIGHT);

    setScale(ratio);

    setOffset({
      x: (window.innerWidth - ARTBOARD_WIDTH * ratio) / 2,
      y: (window.innerHeight - ARTBOARD_HEIGHT * ratio) / 2,
    });
    setArtboardSize({ w: window.innerWidth, h: window.innerHeight });

  };

  useEffect(() => {
    resizeWindow();
    window.addEventListener("resize", resizeWindow);
    return () => window.removeEventListener("resize", resizeWindow);
  }, []);


  const getMousePos = (e) => {
    const rect = upperRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * ARTBOARD_WIDTH + offset.x,
      y: ((e.clientY - rect.top) / rect.height) * ARTBOARD_HEIGHT + offset.y,
    };
  };


/*
  const getMousePos = e => {
    const rect = upperRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left - offset.x;
    const screenY = e.clientY - rect.top - offset.y;

// normalize back to A4 coords
return { x: screenX / scale, y: screenY / scale };
  };
*/
  const hitRect = (obj, mx, my) =>
    mx >= obj.x && mx <= obj.x + obj.w && my >= obj.y && my <= obj.y + obj.h;

    const hitHandle = (obj, mx, my) => {
      const corners = [
        { x: obj.x, y: obj.y },
        { x: obj.x + obj.w, y: obj.y },
        { x: obj.x, y: obj.y + obj.h },
        { x: obj.x + obj.w, y: obj.y + obj.h },
      ];
      for (let i = 0; i < corners.length; i++) {
        const c = corners[i];
        if (mx >= c.x - HANDLE_SIZE && mx <= c.x + HANDLE_SIZE &&
            my >= c.y - HANDLE_SIZE && my <= c.y + HANDLE_SIZE) return i;
      }
      return -1;
    };




    const handleMouseDown = e => {

      const pos = getMousePos(e);

      // handles
      for (let i = objects.length - 1; i >= 0; i--) {
        const handle = hitHandle(objects[i], pos.x, pos.y);
        if (handle >= 0) {
          setResizing({ index: i, corner: handle });
          setSelectedIndex(i);
          return;
        }
      }

      // object selection (topmost first)
      for (let i = objects.length - 1; i >= 0; i--) {
        if (hitRect(objects[i], pos.x, pos.y)) {
          setDragging({ index: i, offsetX: pos.x - objects[i].x, offsetY: pos.y - objects[i].y });
          setSelectedIndex(i);
          return;
        }
      }

      setSelectedIndex(null);
    };

  const handleMouseMove = e => {
    const pos = getMousePos(e);

    if (resizing) {
      const { index, corner } = resizing;
      setObjects(prev => {
        const newArr = [...prev];
        const obj = { ...newArr[index] };
        switch (corner) {
          case 0: obj.w += obj.x - pos.x; obj.h += obj.y - pos.y; obj.x = pos.x; obj.y = pos.y; break;
          case 1: obj.w = pos.x - obj.x; obj.h += obj.y - pos.y; obj.y = pos.y; break;
          case 2: obj.w += obj.x - pos.x; obj.h = pos.y - obj.y; obj.x = pos.x; break;
          case 3: obj.w = pos.x - obj.x; obj.h = pos.y - obj.y; break;
        }
        newArr[index] = obj;
        return newArr;
      });
      return;
    }

    if (dragging) {
      const { index, offsetX, offsetY } = dragging;
      setObjects(prev => {
        const newArr = [...prev];
        newArr[index] = { ...newArr[index], x: pos.x - offsetX, y: pos.y - offsetY };
        return newArr;
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  // Draw lower canvas (page)
  useEffect(() => {
    const canvas = lowerRef.current;
    const ctx = canvas.getContext("2d");

    const drawPage = () => {
      ctx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);


      objects.forEach(obj => {
        if (obj.onPage) {
          ctx.fillStyle = "steelblue";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }else{
          ctx.fillStyle = "lightcoral";
          ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        }
      });

      requestAnimationFrame(drawPage);
    };

    console.log('lower canvas')
    drawPage();
  }, [objects]);

  // Draw upper canvas (artboard, handles)
  useEffect(() => {
    const canvas = upperRef.current;
    const ctx = canvas.getContext("2d");

    const drawSelection = () => {
      ctx.clearRect(0, 0, ARTBOARD_WIDTH, ARTBOARD_HEIGHT);

      if (selectedIndex != null) {
        const obj = objects[selectedIndex];
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
      //  ctx.setLineDash([6, 4]);

        ctx.strokeRect(obj.x+offset.x, obj.y+offset.y, obj.w, obj.h);

        // handles
        const corners = [
          { x: obj.x+offset.x, y: obj.y+offset.y },
          { x: obj.x+offset.x + obj.w, y: obj.y+offset.y },
          { x: obj.x+offset.x, y: obj.y+offset.y + obj.h },
          { x: obj.x+offset.x + obj.w, y: obj.y+offset.y + obj.h },
        ];
        ctx.fillStyle = "white";
        ctx.strokeStyle = "black";
        ctx.setLineDash([]);
        corners.forEach(c => {
          ctx.fillRect(c.x - HANDLE_SIZE / 2, c.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
          ctx.strokeRect(c.x - HANDLE_SIZE / 2, c.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        });
      }

      requestAnimationFrame(drawSelection);
    };
  console.log('lower canvas')
    drawSelection();
  }, [objects, selectedIndex, offset]);

  return (
    <div
      style={{
        position: "relative",
        width:'100%',
        height: ARTBOARD_HEIGHT * scale,
        margin: "0 auto",
        border: "1px solid #ccc",
      }}
    >
      {/* Lower canvas: A4 page */}
      <canvas
        ref={lowerRef}
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        style={{
          position: "absolute",
          top: (ARTBOARD_HEIGHT - PAGE_HEIGHT) / 2 * scale,
          left: (ARTBOARD_WIDTH - PAGE_WIDTH) / 2 * scale,
          width: PAGE_WIDTH * scale,
          height: PAGE_HEIGHT * scale,
          zIndex: 0,
        }}
      />

      {/* Upper canvas: artboard */}
      <canvas
        ref={upperRef}
        width={ARTBOARD_WIDTH}
        height={ARTBOARD_HEIGHT}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: ARTBOARD_WIDTH * scale,
          height: ARTBOARD_HEIGHT * scale,
          zIndex: 1,
          cursor: "pointer",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};
