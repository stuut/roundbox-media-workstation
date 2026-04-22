'use client'



import React, { useRef, useEffect, useState, useCallback } from 'react';

export const CanvasDesignSystem = () => {
  const artboardCanvasRef = useRef(null);
  const pageCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [pageSize, setPageSize] = useState({ width: 400, height: 600 });
  const [pagePosition, setPagePosition] = useState({ x: 400, y: 100 });

  // Single list of elements with canvas property
  const [pageElements, setPageElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);

  const [dragState, setDragState] = useState({
    isDragging: false,
    target: null,
    offset: { x: 0, y: 0 }
  });
  const [isPanningPage, setIsPanningPage] = useState(false);

  // Get accurate mouse coordinates accounting for canvas scaling
  const getCanvasCoordinates = useCallback((canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }, []);

  // Initialize canvas sizes
  useEffect(() => {
    const updateCanvasSize = () => {
      const newWidth = window.innerWidth - 40;
      const newHeight = window.innerHeight - 120;
      setCanvasSize({ width: newWidth, height: newHeight });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Helper functions to filter elements by canvas
  const getArtboardElements = () => pageElements.filter(el => el.canvas === 'artboard');
  const getPageElements = () => pageElements.filter(el => el.canvas === 'page');

  // Draw artboard canvas (background workspace)
  const drawArtboard = useCallback(() => {
    const canvas = artboardCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark workspace background
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    const gridSize = 20;

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw artboard elements
    getArtboardElements().forEach((element) => {
      ctx.save();

      // Apply rotation if it exists
      if (element.rotation) {
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      ctx.fillStyle = element.color;
      if (element.type === 'rectangle') {
        ctx.fillRect(element.x, element.y, element.width, element.height);
      } else if (element.type === 'circle') {
        ctx.beginPath();
        ctx.arc(element.x + element.width/2, element.y + element.width/2, element.width/2, 0, 2 * Math.PI);
        ctx.fill();
      } else if (element.type === 'controller') {
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(element.label || 'Controller',
          element.x + element.width / 2,
          element.y + element.height / 2 + 5
        );
      }

      ctx.restore();

    });

    // Draw page canvas outline on artboard
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pagePosition.x - 1, pagePosition.y - 1, pageSize.width + 2, pageSize.height + 2);

    // Page shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(pagePosition.x + 4, pagePosition.y + 4, pageSize.width, pageSize.height);
  }, [pageElements, pagePosition, pageSize]);

  // Draw page canvas (document content only)
  const drawPage = useCallback(() => {
    const canvas = pageCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // White page background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw only elements that belong to the page
    getPageElements().forEach((element) => {
      ctx.fillStyle = element.color;
      if (element.type === 'rectangle') {
        ctx.fillRect(element.x, element.y, element.width, element.height);
      } else if (element.type === 'circle') {
        ctx.beginPath();
        ctx.arc(element.x + element.width/2, element.y + element.width/2, element.width/2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [pageElements]);

  // Draw overlay canvas (selection handles, guides, etc.)
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!selectedElement) return;

    // Find the selected element in the unified list
    const element = pageElements[selectedElement.index];
    if (!element) return;

    let elementX, elementY, elementWidth, elementHeight;

    // Calculate selection bounds based on which canvas the element is on
    if (element.canvas === 'artboard') {
      // Use artboard coordinates directly
      elementX = element.x;
      elementY = element.y;
      elementWidth = element.width;
      elementHeight = element.height;
    } else if (element.canvas === 'page') {
      // Convert page coordinates to artboard coordinates for overlay
      elementX = pagePosition.x + element.x;
      elementY = pagePosition.y + element.y;
      elementWidth = element.width;
      elementHeight = element.height;
    }

    // Draw selection rectangle
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(elementX - 2, elementY - 2, elementWidth + 4, elementHeight + 4);
    ctx.setLineDash([]);

    // Draw resize handles
    const handleSize = 8;
    const handles = [
      { x: elementX - handleSize/2, y: elementY - handleSize/2 }, // top-left
      { x: elementX + elementWidth/2 - handleSize/2, y: elementY - handleSize/2 }, // top-center
      { x: elementX + elementWidth - handleSize/2, y: elementY - handleSize/2 }, // top-right
      { x: elementX + elementWidth - handleSize/2, y: elementY + elementHeight/2 - handleSize/2 }, // middle-right
      { x: elementX + elementWidth - handleSize/2, y: elementY + elementHeight - handleSize/2 }, // bottom-right
      { x: elementX + elementWidth/2 - handleSize/2, y: elementY + elementHeight - handleSize/2 }, // bottom-center
      { x: elementX - handleSize/2, y: elementY + elementHeight - handleSize/2 }, // bottom-left
      { x: elementX - handleSize/2, y: elementY + elementHeight/2 - handleSize/2 }, // middle-left
    ];

    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;

    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  }, [selectedElement, pageElements, pagePosition]);

  // Redraw all canvases when data changes
  useEffect(() => {
    drawArtboard();
  }, [drawArtboard]);

  useEffect(() => {
    drawPage();
  }, [drawPage]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // Check if coordinates are within page canvas area
  const isWithinPageCanvas = (coords) => {
    return coords.x >= pagePosition.x &&
           coords.x <= pagePosition.x + pageSize.width &&
           coords.y >= pagePosition.y &&
           coords.y <= pagePosition.y + pageSize.height;
  };

  // Find element at coordinates
  const findElementAt = (elements, x, y) => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
        return { element: el, index: i };
      }
    }
    return null;
  };

  // Mouse handlers
  const handleMouseDown = (event) => {
    const coords = getCanvasCoordinates(overlayCanvasRef.current, event);

    // Check if click is within page canvas area
    if (isWithinPageCanvas(coords)) {
      // Convert to page-relative coordinates
      const pageCoords = {
        x: coords.x - pagePosition.x,
        y: coords.y - pagePosition.y
      };

      // Find page elements
      const pageElementsOnly = getPageElements();
      const found = findElementAt(pageElementsOnly, pageCoords.x, pageCoords.y);

      if (found) {
        // Find the actual index in the full pageElements array
        const actualIndex = pageElements.findIndex(el => el.id === found.element.id);

        setSelectedElement({ index: actualIndex });
        setDragState({
          isDragging: true,
          target: { type: 'pageElement', index: actualIndex },
          offset: { x: pageCoords.x - found.element.x, y: pageCoords.y - found.element.y }
        });
      } else {
        // Start panning the page canvas or deselect
        if (event.altKey || event.button === 1) {
          setIsPanningPage(true);
          setDragState({
            isDragging: true,
            target: { type: 'pageCanvas' },
            offset: { x: coords.x - pagePosition.x, y: coords.y - pagePosition.y }
          });
        } else {
          setSelectedElement(null);
        }
      }
    } else {
      // Click on artboard outside page
      const artboardElementsOnly = getArtboardElements();
      const found = findElementAt(artboardElementsOnly, coords.x, coords.y);

      if (found) {
        // Find the actual index in the full pageElements array
        const actualIndex = pageElements.findIndex(el => el.id === found.element.id);

        setSelectedElement({ index: actualIndex });
        setDragState({
          isDragging: true,
          target: { type: 'artboardElement', index: actualIndex },
          offset: { x: coords.x - found.element.x, y: coords.y - found.element.y }
        });
      } else {
        setSelectedElement(null);
      }
    }
  };

  const handleMouseMove = (event) => {
    if (!dragState.isDragging) return;

    const coords = getCanvasCoordinates(overlayCanvasRef.current, event);

    if (dragState.target.type === 'artboardElement') {
      const element = pageElements[dragState.target.index];
      const isWithinPage = isWithinPageCanvas(coords);

      if (isWithinPage && element.type !== 'controller') {
        // TRANSFER: Artboard → Page
        const pageCoords = {
          x: coords.x - pagePosition.x - dragState.offset.x,
          y: coords.y - pagePosition.y - dragState.offset.y
        };

        setPageElements(prev => prev.map((el, i) =>
          i === dragState.target.index
            ? {
                ...el,
                canvas: 'page',
                x: Math.max(0, Math.min(pageSize.width - el.width, pageCoords.x)),
                y: Math.max(0, Math.min(pageSize.height - el.height, pageCoords.y))
              }
            : el
        ));

        // Update drag state to continue as page element
        setDragState(prev => ({
          ...prev,
          target: { type: 'pageElement', index: dragState.target.index }
        }));
      } else {
        // Normal artboard element movement
        const newX = coords.x - dragState.offset.x;
        const newY = coords.y - dragState.offset.y;

        setPageElements(prev => prev.map((el, i) =>
          i === dragState.target.index
            ? { ...el, x: newX, y: newY }
            : el
        ));
      }
    } else if (dragState.target.type === 'pageElement') {
      const isOutsidePage = !isWithinPageCanvas(coords);

      if (isOutsidePage) {
        // TRANSFER: Page → Artboard
        const newX = coords.x - dragState.offset.x;
        const newY = coords.y - dragState.offset.y;

        setPageElements(prev => prev.map((el, i) =>
          i === dragState.target.index
            ? { ...el, canvas: 'artboard', x: newX, y: newY }
            : el
        ));

        // Update drag state to continue as artboard element
        setDragState(prev => ({
          ...prev,
          target: { type: 'artboardElement', index: dragState.target.index }
        }));
      } else {
        // Still within page bounds - normal page element movement
        const pageCoords = {
          x: coords.x - pagePosition.x - dragState.offset.x,
          y: coords.y - pagePosition.y - dragState.offset.y
        };

        setPageElements(prev => prev.map((el, i) =>
          i === dragState.target.index
            ? { ...el, x: Math.max(0, Math.min(pageSize.width - el.width, pageCoords.x)),
                       y: Math.max(0, Math.min(pageSize.height - el.height, pageCoords.y)) }
            : el
        ));
      }
    } else if (dragState.target.type === 'pageCanvas' && isPanningPage) {
      const newX = coords.x - dragState.offset.x;
      const newY = coords.y - dragState.offset.y;

      setPagePosition({
        x: Math.max(0, Math.min(canvasSize.width - pageSize.width, newX)),
        y: Math.max(0, Math.min(canvasSize.height - pageSize.height, newY))
      });
    }
  };

  const handleMouseUp = () => {
    setDragState({ isDragging: false, target: null, offset: { x: 0, y: 0 } });
    setIsPanningPage(false);
  };

  // Add element to page
  const addPageElement = (type) => {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const newElement = {
      id: Date.now(),
      type,
      canvas: 'page', // Start on page
      x: Math.random() * (pageSize.width - 60),
      y: Math.random() * (pageSize.height - 60),
      width: 60,
      height: 60,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    setPageElements(prev => [...prev, newElement]);
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#111827',
      fontFamily: 'Arial, sans-serif'
    },
    toolbar: {
      backgroundColor: '#1f2937',
      padding: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #374151'
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px'
    },
    button: {
      padding: '6px 12px',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    pageButton: {
      backgroundColor: '#dc2626'
    },
    statusText: {
      color: '#d1d5db',
      fontSize: '14px'
    },
    canvasContainer: {
      flex: 1,
      position: 'relative',
      overflow: 'hidden'
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      imageRendering: 'pixelated'
    },
    pageCanvas: {
      position: 'absolute',
      border: '2px solid white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      imageRendering: 'pixelated',
      pointerEvents: 'none'
    },
    overlayCanvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'all',
      cursor: 'crosshair'
    },
    statusBar: {
      backgroundColor: '#1f2937',
      padding: '8px 12px',
      color: '#d1d5db',
      fontSize: '12px',
      borderTop: '1px solid #374151',
      display: 'flex',
      justifyContent: 'space-between'
    }
  };



  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.buttonGroup}>
          {/* Empty group where artboard buttons were */}
        </div>

        <div style={styles.buttonGroup}>
          <button
            onClick={() => addPageElement('rectangle')}
            style={{ ...styles.button, ...styles.pageButton }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            Add Rectangle
          </button>
          <button
            onClick={() => addPageElement('circle')}
            style={{ ...styles.button, ...styles.pageButton }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            Add Circle
          </button>
        </div>

        <div style={styles.statusText}>
          Hold Alt + drag to pan page | Click handles to resize/rotate | Drag elements between page and artboard | Page: {getPageElements().length} | Artboard: {getArtboardElements().length}
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} style={styles.canvasContainer}>
        {/* Artboard Canvas - Background Layer */}
        <canvas
          ref={artboardCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={styles.canvas}
        />

        {/* Page Canvas - Content Layer */}
        <canvas
          ref={pageCanvasRef}
          width={3000}
          height={4000}
          style={{
            ...styles.pageCanvas,
            left: `${(pagePosition.x / canvasSize.width) * 100}%`,
            top: `${(pagePosition.y / canvasSize.height) * 100}%`,
            width: `${(pageSize.width / canvasSize.width) * 100}%`,
            height: `${(pageSize.height / canvasSize.height) * 100}%`
          }}
        />

        {/* Overlay Canvas - UI Layer */}
        <canvas
          ref={overlayCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={styles.overlayCanvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Status Bar */}
      <div style={styles.statusBar}>
        <span>
          Artboard: {canvasSize.width}×{canvasSize.height} |
          Page: {pageSize.width}×{pageSize.height} @ ({Math.round(pagePosition.x)}, {Math.round(pagePosition.y)})
        </span>
        <span>
          {selectedElement && `Selected: ${pageElements[selectedElement.index]?.canvas} element`}
          {dragState.isDragging && ` | Dragging: ${dragState.target.type}`}
          {isPanningPage && ' | Panning Page'}
        </span>
      </div>
    </div>
  );
};

export default CanvasDesignSystem;
