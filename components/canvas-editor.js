'use client';

import React, { useRef, useState, useEffect } from "react";

const HANDLE_SIZE = 8;

const ARTBOARD_WIDTH = 1000;
const ARTBOARD_HEIGHT = 1200;

function mmToPixels(mm, dpi) {
  return Math.round((mm / 25.4) * dpi);
}

const PAGE_WIDTH = mmToPixels(210, 300);
const PAGE_HEIGHT = mmToPixels(297, 300);

//const PAGE_WIDTH = 600;
//const PAGE_HEIGHT = 600;

export const ThreeCanvasArtboard = () => {
  const artboardRef = useRef(null);
  const lowerRef = useRef(null);
  const upperRef = useRef(null);

  const [offset, setOffset] = useState({x:100,y:100})
  const [scale, setScale] = useState(1)
  const [artboardSize, setArtboardSize] = useState({w:2000,h:2000})


  const [objects, setObjects] = useState([
    { x: 100, y: 100, w: 150, h: 100, onPage: true },
    { x: 100, y: 200, w: 100, h: 100, onPage: false },
  ]);

  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const calculateRatio=(containerWidth, boxWidth)=>{
    return containerWidth/boxWidth
  }


  const resizeWindow = () => {
      const width = window.innerWidth * 0.9;   // leave some margin
      const height = window.innerHeight * 0.9;

      // fit-to-window scale (preserve aspect ratio)
      const newScale = Math.min(width / PAGE_WIDTH, height / PAGE_HEIGHT);

      const offsetX = (window.innerWidth - PAGE_WIDTH * newScale) / 2;
      const offsetY = (window.innerHeight - PAGE_HEIGHT * newScale) / 2;

      setScale(newScale);
      setOffset({ x: offsetX, y: offsetY });
      setArtboardSize({ w: window.innerWidth, h: window.innerHeight });
    };




  useEffect(() => {


    if (window){
      window.addEventListener('resize', resizeWindow);
      resizeWindow()

    }

    return () => {
      window.removeEventListener('resize', resizeWindow)
    }


}, []);

  // Draw artboard
  useEffect(() => {
    const canvas = artboardRef.current;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      ctx.clearRect(0, 0, artboardSize.w, artboardSize.h);

      // background grid
      ctx.fillStyle = "#ddd";
      ctx.fillRect(0, 0, artboardSize.w, artboardSize.h);

      // all objects
      objects.forEach(obj => {
        ctx.fillStyle = obj.onPage ? "steelblue" : "lightcoral";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(obj.x+offset.x, obj.y+offset.y, obj.w, obj.h);

      });

      requestAnimationFrame(draw);
    };

    draw();
  }, [objects, offset]);

  // Draw lower canvas (page objects only)
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

  // Draw upper canvas (selection & handles)
  useEffect(() => {
    const canvas = upperRef.current;
    const ctx = canvas.getContext("2d");

    const drawSelection = () => {
      ctx.clearRect(0, 0, artboardSize.w, artboardSize.h);

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

  const getMousePos = e => {
    const rect = artboardRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left - offset.x;
    const screenY = e.clientY - rect.top - offset.y;

// normalize back to A4 coords
    return { x: screenX / scale, y: screenY / scale };
  };

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


  const exportPage300DPI = () => {
  const scale = 300 / 72; // 72 is default canvas dpi
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = PAGE_WIDTH * scale;
  exportCanvas.height = PAGE_HEIGHT * scale;
  const ctx = exportCanvas.getContext("2d");

  // draw lower canvas onto export canvas
  ctx.scale(scale, scale);
  ctx.drawImage(lowerRef.current, 0, 0);

  const dataURL = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "page_300dpi.png";
  link.click();
};

const exportPage = () => {
  const lowerCanvas = lowerRef.current;
  const dataURL = lowerCanvas.toDataURL("image/png"); // PNG of page only

  // create a temporary link to download
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "page.png";
  link.click();
};

  return (
    <div id="stage-container" style={{ position: "relative"}}>
      <div id="stage" className="stage">

        <div className="artboard-canvas">
          <canvas
            ref={artboardRef}
            width={artboardSize.w}
            height={artboardSize.h}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
          />
        </div>
        <div id="canvas-container" style={{
          width:PAGE_WIDTH,
          height:PAGE_HEIGHT,
          //transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transformOrigin: "top left"
        }}>
          <canvas
            id="background-canvas"
            className='canvas'
            ref={lowerRef}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
          />
          <canvas
            id="foreground-canvas"
            className='canvas'
            ref={upperRef}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
};
