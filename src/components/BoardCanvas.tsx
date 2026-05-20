import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, PanResponder, GestureResponderEvent, Platform } from 'react-native';
import Svg, { Path, Rect as SvgRect, Circle as SvgCircle, Line as SvgLine } from 'react-native-svg';
import { Square, Circle, Minus, Paintbrush, Eraser, ZoomIn, ZoomOut, Move, Grid, HelpCircle, Type, Sparkles } from 'lucide-react-native';
import StickyNote, { NoteData } from './StickyNote';
import { aiService } from '../config/api';

interface BoardCanvasProps {
  notes: NoteData[];
  onAddNote: (note: Partial<NoteData>) => void;
  onUpdateNote: (id: string, updated: Partial<NoteData>) => void;
  onDeleteNote: (id: string) => void;
  dark?: boolean;
}

interface DrawElement {
  id: string;
  type: 'free' | 'rect' | 'circle' | 'line';
  points: string; // "x1,y1 x2,y2 ..."
  color: string;
  size: number;
}

const BRUSH_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#1e293b', '#ffffff'];
const BRUSH_SIZES = [2, 4, 8, 12, 16];

export const BoardCanvas: React.FC<BoardCanvasProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote, dark = false }) => {
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [tool, setTool] = useState<'pen' | 'shape' | 'eraser' | 'pan' | 'handwrite'>('pen');
  const [shapeType, setShapeType] = useState<'rect' | 'circle' | 'line'>('rect');
  const [brushColor, setBrushColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(4);
  const [showGrid, setShowGrid] = useState(true);

  // Handwriting states
  const [handwriteStrokes, setHandwriteStrokes] = useState<string[]>([]);
  const [handwriteLang, setHandwriteLang] = useState<'en' | 'te' | 'hi' | 'fr' | 'de'>('en');
  const [isRecognizing, setIsRecognizing] = useState(false);

  // Zoom & Pan offset
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Current drawing state
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const drawingStartPoint = useRef({ x: 0, y: 0 });
  const containerRef = useRef<View>(null);

  // Pan & Draw Board Responder
  const lastPanPoint = useRef({ x: 0, y: 0 });
  
  // Convert touch/click coordinate to canvas space taking pan and zoom into account
  const getCanvasCoords = (e: GestureResponderEvent) => {
    let clientX = e.nativeEvent.locationX;
    let clientY = e.nativeEvent.locationY;

    // For Web, calculate coordinates relative to the SVG container boundaries using client/page values
    if (Platform.OS === 'web' && containerRef.current) {
      const el = containerRef.current as any;
      if (el.getBoundingClientRect) {
        const rect = el.getBoundingClientRect();
        // Use pageX/pageY if available, otherwise clientX/clientY
        const pageX = (e.nativeEvent as any).pageX || (e.nativeEvent as any).clientX || 0;
        const pageY = (e.nativeEvent as any).pageY || (e.nativeEvent as any).clientY || 0;
        
        clientX = pageX - rect.left;
        clientY = pageY - rect.top;
      }
    }

    // Convert to unpanned, unzoomed canvas space
    const canvasX = (clientX - panOffset.x) / zoom;
    const canvasY = (clientY - panOffset.y) / zoom;
    
    return { x: canvasX, y: canvasY };
  };

  const boardPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // Do not respond to touches on interactive buttons inside the controls
        const targetTagName = (evt.target as any)?.tagName?.toLowerCase();
        if (targetTagName === 'button' || targetTagName === 'input' || targetTagName === 'a') {
          return false;
        }
        return true;
      },
      onMoveShouldSetPanResponder: (evt) => {
        const targetTagName = (evt.target as any)?.tagName?.toLowerCase();
        if (targetTagName === 'button' || targetTagName === 'input' || targetTagName === 'a') {
          return false;
        }
        return true;
      },
      onPanResponderGrant: (evt) => {
        const coords = getCanvasCoords(evt);
        drawingStartPoint.current = coords;
        
        const { pageX, pageY } = evt.nativeEvent;
        lastPanPoint.current = { x: pageX, y: pageY };
 
        if (tool === 'pan') {
          return;
        }
 
        if (tool === 'pen' || tool === 'handwrite') {
          const isHW = tool === 'handwrite';
          const newId = Math.random().toString();
          if (isHW) {
            setHandwriteStrokes(prev => [...prev, newId]);
          }
          setCurrentElement({
            id: newId,
            type: 'free',
            points: `${coords.x},${coords.y}`,
            color: isHW ? '#818cf8' : brushColor,
            size: isHW ? 5 : brushSize
          });
        } else if (tool === 'shape') {
          setCurrentElement({
            id: Math.random().toString(),
            type: shapeType,
            points: `${coords.x},${coords.y} ${coords.x},${coords.y}`,
            color: brushColor,
            size: brushSize
          });
        } else if (tool === 'eraser') {
          eraseAtPoint(coords.x, coords.y);
        }
      },
      onPanResponderMove: (evt) => {
        const coords = getCanvasCoords(evt);
  
        if (tool === 'pan') {
          const { pageX, pageY } = evt.nativeEvent;
          const dx = pageX - lastPanPoint.current.x;
          const dy = pageY - lastPanPoint.current.y;
          setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          lastPanPoint.current = { x: pageX, y: pageY };
        } else if (tool === 'pen' || tool === 'handwrite') {
          setCurrentElement(prev => prev ? {
            ...prev,
            points: `${prev.points} ${coords.x},${coords.y}`
          } : null);
        } else if (tool === 'shape') {
          const start = drawingStartPoint.current;
          if (currentElement) {
            if (currentElement.type === 'rect') {
              const width = coords.x - start.x;
              const height = coords.y - start.y;
              setCurrentElement(prev => prev ? {
                ...prev,
                points: `${start.x},${start.y} ${width},${height}`
              } : null);
            } else if (currentElement.type === 'circle') {
              const radius = Math.sqrt(Math.pow(coords.x - start.x, 2) + Math.pow(coords.y - start.y, 2));
              setCurrentElement(prev => prev ? {
                ...prev,
                points: `${start.x},${start.y} ${radius}`
              } : null);
            } else if (currentElement.type === 'line') {
              setCurrentElement(prev => prev ? {
                ...prev,
                points: `${start.x},${start.y} ${coords.x},${coords.y}`
              } : null);
            }
          }
        } else if (tool === 'eraser') {
          eraseAtPoint(coords.x, coords.y);
        }
      },
      onPanResponderRelease: () => {
        if (currentElement && tool !== 'eraser') {
          setElements(prev => [...prev, currentElement]);
        }
        setCurrentElement(null);
      }
    })
  ).current;

  // Web-specific DOM direct mouse fallbacks for absolute event capturing reliability
  const isMouseDown = useRef(false);

  const handleMouseDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    
    // Check if clicked element is an interactive button
    const targetTagName = e.target?.tagName?.toLowerCase();
    if (targetTagName === 'button' || targetTagName === 'input' || targetTagName === 'a') {
      return;
    }
    
    isMouseDown.current = true;
    
    // Simulate gesture event
    const fakeEvt = {
      nativeEvent: {
        pageX: e.pageX,
        pageY: e.pageY,
        clientX: e.clientX,
        clientY: e.clientY,
        locationX: e.clientX,
        locationY: e.clientY
      }
    } as any;
    
    const coords = getCanvasCoords(fakeEvt);
    drawingStartPoint.current = coords;
    lastPanPoint.current = { x: e.pageX, y: e.pageY };

    if (tool === 'pan') {
      return;
    }

    if (tool === 'pen' || tool === 'handwrite') {
      const isHW = tool === 'handwrite';
      const newId = Math.random().toString();
      if (isHW) {
        setHandwriteStrokes(prev => [...prev, newId]);
      }
      setCurrentElement({
        id: newId,
        type: 'free',
        points: `${coords.x},${coords.y}`,
        color: isHW ? '#818cf8' : brushColor,
        size: isHW ? 5 : brushSize
      });
    } else if (tool === 'shape') {
      setCurrentElement({
        id: Math.random().toString(),
        type: shapeType,
        points: `${coords.x},${coords.y} ${coords.x},${coords.y}`,
        color: brushColor,
        size: brushSize
      });
    } else if (tool === 'eraser') {
      eraseAtPoint(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: any) => {
    if (Platform.OS !== 'web' || !isMouseDown.current) return;
    
    const fakeEvt = {
      nativeEvent: {
        pageX: e.pageX,
        pageY: e.pageY,
        clientX: e.clientX,
        clientY: e.clientY,
        locationX: e.clientX,
        locationY: e.clientY
      }
    } as any;
    
    const coords = getCanvasCoords(fakeEvt);

    if (tool === 'pan') {
      const dx = e.pageX - lastPanPoint.current.x;
      const dy = e.pageY - lastPanPoint.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.pageX, y: e.pageY };
    } else if (tool === 'pen' || tool === 'handwrite') {
      setCurrentElement(prev => prev ? {
        ...prev,
        points: `${prev.points} ${coords.x},${coords.y}`
      } : null);
    } else if (tool === 'shape') {
      const start = drawingStartPoint.current;
      if (currentElement) {
        if (currentElement.type === 'rect') {
          const width = coords.x - start.x;
          const height = coords.y - start.y;
          setCurrentElement(prev => prev ? {
            ...prev,
            points: `${start.x},${start.y} ${width},${height}`
          } : null);
        } else if (currentElement.type === 'circle') {
          const radius = Math.sqrt(Math.pow(coords.x - start.x, 2) + Math.pow(coords.y - start.y, 2));
          setCurrentElement(prev => prev ? {
            ...prev,
            points: `${start.x},${start.y} ${radius}`
          } : null);
        } else if (currentElement.type === 'line') {
          setCurrentElement(prev => prev ? {
            ...prev,
            points: `${start.x},${start.y} ${coords.x},${coords.y}`
          } : null);
        }
      }
    } else if (tool === 'eraser') {
      eraseAtPoint(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    if (Platform.OS !== 'web') return;
    isMouseDown.current = false;
    
    if (currentElement && tool !== 'eraser') {
      setElements(prev => [...prev, currentElement]);
    }
    setCurrentElement(null);
  };

  const handleTouchStart = (e: any) => {
    if (Platform.OS !== 'web') return;
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    if (!touch) return;
    
    isMouseDown.current = true;
    
    const fakeEvt = {
      nativeEvent: {
        pageX: touch.pageX,
        pageY: touch.pageY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        locationX: touch.clientX,
        locationY: touch.clientY
      }
    } as any;
    
    const coords = getCanvasCoords(fakeEvt);
    drawingStartPoint.current = coords;
    lastPanPoint.current = { x: touch.pageX, y: touch.pageY };

    if (tool === 'pan') {
      return;
    }

    if (tool === 'pen' || tool === 'handwrite') {
      const isHW = tool === 'handwrite';
      const newId = Math.random().toString();
      if (isHW) {
        setHandwriteStrokes(prev => [...prev, newId]);
      }
      setCurrentElement({
        id: newId,
        type: 'free',
        points: `${coords.x},${coords.y}`,
        color: isHW ? '#818cf8' : brushColor,
        size: isHW ? 5 : brushSize
      });
    } else if (tool === 'shape') {
      setCurrentElement({
        id: Math.random().toString(),
        type: shapeType,
        points: `${coords.x},${coords.y} ${coords.x},${coords.y}`,
        color: brushColor,
        size: brushSize
      });
    } else if (tool === 'eraser') {
      eraseAtPoint(coords.x, coords.y);
    }
  };

  const handleTouchMove = (e: any) => {
    if (Platform.OS !== 'web' || !isMouseDown.current) return;
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    if (!touch) return;
    
    const fakeEvt = {
      nativeEvent: {
        pageX: touch.pageX,
        pageY: touch.pageY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        locationX: touch.clientX,
        locationY: touch.clientY
      }
    } as any;
    
    const coords = getCanvasCoords(fakeEvt);

    if (tool === 'pan') {
      const dx = touch.pageX - lastPanPoint.current.x;
      const dy = touch.pageY - lastPanPoint.current.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: touch.pageX, y: touch.pageY };
    } else if (tool === 'pen' || tool === 'handwrite') {
      setCurrentElement(prev => prev ? {
        ...prev,
        points: `${prev.points} ${coords.x},${coords.y}`
      } : null);
    } else if (tool === 'shape') {
      const start = drawingStartPoint.current;
      if (currentElement) {
        if (currentElement.type === 'rect') {
          const width = coords.x - start.x;
          const height = coords.y - start.y;
          setCurrentElement(prev => prev ? {
            ...prev,
            points: `${start.x},${start.y} ${width},${height}`
          } : null);
        } else if (currentElement.type === 'circle') {
          const radius = Math.sqrt(Math.pow(coords.x - start.x, 2) + Math.pow(coords.y - start.y, 2));
          setCurrentElement(prev => prev ? {
            ...prev,
            points: `${start.x},${start.y} ${radius}`
          } : null);
        } else if (currentElement.type === 'line') {
          setCurrentElement(prev => prev ? {
            ...prev,
            points: `${start.x},${start.y} ${coords.x},${coords.y}`
          } : null);
        }
      }
    } else if (tool === 'eraser') {
      eraseAtPoint(coords.x, coords.y);
    }
  };

  const handleTouchEnd = () => {
    if (Platform.OS !== 'web') return;
    isMouseDown.current = false;
    
    if (currentElement && tool !== 'eraser') {
      setElements(prev => [...prev, currentElement]);
    }
    setCurrentElement(null);
  };

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const container = containerRef.current as any;
    if (!container) return;

    const domNode = container.select_dom_node ? container.select_dom_node() : container;
    if (!domNode) return;

    const onTouchStartNative = (e: any) => {
      const targetTagName = e.target?.tagName?.toLowerCase();
      if (targetTagName === 'button' || targetTagName === 'input' || targetTagName === 'a') {
        return;
      }
      e.preventDefault();
      handleTouchStart(e);
    };

    const onTouchMoveNative = (e: any) => {
      e.preventDefault();
      handleTouchMove(e);
    };

    const onTouchEndNative = (e: any) => {
      handleTouchEnd();
    };

    domNode.addEventListener('touchstart', onTouchStartNative, { passive: false });
    domNode.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    domNode.addEventListener('touchend', onTouchEndNative, { passive: false });

    return () => {
      domNode.removeEventListener('touchstart', onTouchStartNative);
      domNode.removeEventListener('touchmove', onTouchMoveNative);
      domNode.removeEventListener('touchend', onTouchEndNative);
    };
  }, [tool, brushColor, brushSize, shapeType]);

  const eraseAtPoint = (x: number, y: number) => {
    // Simple point distance-based line segment/shape eraser
    const threshold = 15;
    setElements(prev => prev.filter(el => {
      const parts = el.points.split(' ');
      
      if (el.type === 'free') {
        // Check if any point along the line is close to eraser
        return !parts.some(p => {
          const [px, py] = p.split(',').map(Number);
          return Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2)) < threshold;
        });
      } else {
        // Shapes: Check start point
        const [sx, sy] = parts[0].split(',').map(Number);
        return Math.sqrt(Math.pow(sx - x, 2) + Math.pow(sy - y, 2)) > threshold * 2;
      }
    }));
  };

  const renderElement = (el: DrawElement) => {
    const parts = el.points.split(' ');
    
    if (el.type === 'free') {
      // Build SVG Path
      const pathData = parts.reduce((acc, point, idx) => {
        const [px, py] = point.split(',');
        if (isNaN(Number(px)) || isNaN(Number(py))) return acc;
        return idx === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
      }, "");
      return <Path key={el.id} d={pathData} stroke={el.color} strokeWidth={el.size} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    } else if (el.type === 'rect') {
      const [start, size] = parts;
      const [x, y] = start.split(',').map(Number);
      const [width, height] = size.split(',').map(Number);
      return <SvgRect key={el.id} x={width < 0 ? x + width : x} y={height < 0 ? y + height : y} width={Math.abs(width)} height={Math.abs(height)} stroke={el.color} strokeWidth={el.size} fill="none" />;
    } else if (el.type === 'circle') {
      const [center, rPart] = parts;
      const [cx, cy] = center.split(',').map(Number);
      const radius = Number(rPart);
      return <SvgCircle key={el.id} cx={cx} cy={cy} r={radius} stroke={el.color} strokeWidth={el.size} fill="none" />;
    } else if (el.type === 'line') {
      const [start, end] = parts;
      const [x1, y1] = start.split(',').map(Number);
      const [x2, y2] = end.split(',').map(Number);
      return <SvgLine key={el.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={el.color} strokeWidth={el.size} />;
    }
  };

  const handleConvertHandwriting = async () => {
    if (handwriteStrokes.length === 0) return;
    setIsRecognizing(true);
    try {
      const text = await aiService.recognizeHandwriting(handwriteStrokes.length, handwriteLang);
      
      // Erase scribble paths from screen
      setElements(prev => prev.filter(el => !handwriteStrokes.includes(el.id)));
      
      // Add sticky note at a clean position
      onAddNote({
        title: `Handwritten Note (${handwriteLang.toUpperCase()})`,
        content: text,
        type: 'text',
        color: '#fef08a',
        x: 400 + Math.random() * 50,
        y: 100 + Math.random() * 50,
        checklist: [],
        comments: [],
        attachments: []
      });
      
      setHandwriteStrokes([]);
      setTool('pan');
    } catch (e) {
      console.error("Handwriting conversion failed:", e);
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleClearHandwriting = () => {
    setElements(prev => prev.filter(el => !handwriteStrokes.includes(el.id)));
    setHandwriteStrokes([]);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const next = direction === 'in' ? prev + 0.15 : prev - 0.15;
      return Math.min(Math.max(next, 0.4), 2.5);
    });
  };

  return (
    <View style={[styles.canvasWrapper, dark ? styles.darkWrapper : styles.lightWrapper]}>
      {/* Board controls panel */}
      <View style={styles.floatingControls}>
        <View style={styles.toolGroup}>
          <TouchableOpacity onPress={() => setTool('pen')} style={[styles.controlBtn, tool === 'pen' && styles.activeBtn]}>
            <Paintbrush size={18} color={tool === 'pen' ? '#fff' : (dark ? '#f3f4f6' : '#1f2937')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTool('shape')} style={[styles.controlBtn, tool === 'shape' && styles.activeBtn]}>
            <Square size={18} color={tool === 'shape' ? '#fff' : (dark ? '#f3f4f6' : '#1f2937')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTool('handwrite')} style={[styles.controlBtn, tool === 'handwrite' && styles.activeBtn]}>
            <Type size={18} color={tool === 'handwrite' ? '#fff' : (dark ? '#f3f4f6' : '#1f2937')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTool('eraser')} style={[styles.controlBtn, tool === 'eraser' && styles.activeBtn]}>
            <Eraser size={18} color={tool === 'eraser' ? '#fff' : (dark ? '#f3f4f6' : '#1f2937')} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTool('pan')} style={[styles.controlBtn, tool === 'pan' && styles.activeBtn]}>
            <Move size={18} color={tool === 'pan' ? '#fff' : (dark ? '#f3f4f6' : '#1f2937')} />
          </TouchableOpacity>
        </View>

        {tool === 'shape' && (
          <View style={styles.toolGroup}>
            <TouchableOpacity onPress={() => setShapeType('rect')} style={[styles.subBtn, shapeType === 'rect' && styles.activeSubBtn]}>
              <Square size={14} color={dark ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShapeType('circle')} style={[styles.subBtn, shapeType === 'circle' && styles.activeSubBtn]}>
              <Circle size={14} color={dark ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShapeType('line')} style={[styles.subBtn, shapeType === 'line' && styles.activeSubBtn]}>
              <Minus size={14} color={dark ? '#f3f4f6' : '#1f2937'} />
            </TouchableOpacity>
          </View>
        )}

        {/* Color picker */}
        {(tool === 'pen' || tool === 'shape' || tool === 'handwrite') && (
          <View style={styles.colorPickerContainer}>
            {BRUSH_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setBrushColor(c)}
                style={[
                  styles.colorBox,
                  { backgroundColor: c },
                  brushColor === c && styles.activeColorBox
                ]}
              />
            ))}
          </View>
        )}

        {/* Brush Size Slider */}
        {(tool === 'pen' || tool === 'shape' || tool === 'handwrite') && (
          <View style={styles.sizePickerContainer}>
            {BRUSH_SIZES.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setBrushSize(s)}
                style={[
                  styles.sizeOption,
                  brushSize === s && styles.activeSizeOption
                ]}
              >
                <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: dark ? '#fff' : '#000' }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Canvas view controls */}
        <View style={styles.toolGroup}>
          <TouchableOpacity onPress={() => handleZoom('in')} style={styles.controlBtn}>
            <ZoomIn size={18} color={dark ? '#f3f4f6' : '#1f2937'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleZoom('out')} style={styles.controlBtn}>
            <ZoomOut size={18} color={dark ? '#f3f4f6' : '#1f2937'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowGrid(!showGrid)} style={[styles.controlBtn, showGrid && styles.activeGridBtn]}>
            <Grid size={18} color={showGrid ? '#6366f1' : (dark ? '#f3f4f6' : '#1f2937')} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.zoomIndicator, dark ? styles.darkText : styles.lightText]}>
          Zoom: {Math.round(zoom * 100)}%
        </Text>
      </View>

      {/* SVG Canvas and Note Workspace */}
      <View
        ref={containerRef}
        style={[
          styles.canvasArea,
          showGrid && (dark ? styles.darkGridBg : styles.lightGridBg)
        ]}
        {...boardPanResponder.panHandlers}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Transform container */}
        <View
          style={{
            transform: [
              { translateX: panOffset.x },
              { translateY: panOffset.y },
              { scale: zoom }
            ],
            width: '100%',
            height: '100%',
            position: 'absolute'
          }}
        >
          {/* Vector Graphics Layout */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            {elements.map(renderElement)}
            {currentElement && renderElement(currentElement)}
          </Svg>

          {/* Sticky Notes Render Overlay */}
          {notes.map(note => (
            <StickyNote
              key={note.id}
              note={note}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
              dark={dark}
            />
          ))}
        </View>
      </View>

      {tool === 'pan' && (
        <View style={styles.toastGuide}>
          <HelpCircle size={14} color="#6366f1" />
          <Text style={styles.toastText}>Pan Mode Active: Drag to navigate around the whiteboard</Text>
        </View>
      )}

      {tool === 'handwrite' && (
        <View style={[styles.handwritingBanner, dark ? styles.darkBannerCard : styles.lightBannerCard]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <Sparkles size={16} color="#818cf8" />
            <Text style={[styles.bannerText, dark ? styles.darkText : styles.lightText]}>
              Write on screen, choose language & convert:
            </Text>
            <View style={styles.langSelectorRow}>
              {(['en', 'te', 'hi', 'fr', 'de'] as const).map(lang => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setHandwriteLang(lang)}
                  style={[
                    styles.bannerLangBtn,
                    handwriteLang === lang && styles.activeBannerLangBtn
                  ]}
                >
                  <Text style={[styles.bannerLangText, handwriteLang === lang && styles.activeBannerLangText]}>
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={handleConvertHandwriting}
              disabled={isRecognizing || handwriteStrokes.length === 0}
              style={[styles.bannerActionBtn, styles.convertBtn, handwriteStrokes.length === 0 && styles.disabledBtn]}
            >
              <Text style={styles.actionBtnText}>
                {isRecognizing ? "Converting..." : "Convert to Note"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearHandwriting}
              disabled={handwriteStrokes.length === 0}
              style={[styles.bannerActionBtn, styles.clearBtn, handwriteStrokes.length === 0 && styles.disabledBtn]}
            >
              <Text style={styles.actionBtnText}>Clear Scribble</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  canvasWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  lightWrapper: {
    backgroundColor: '#f8fafc'
  },
  darkWrapper: {
    backgroundColor: '#0f172a'
  },
  canvasArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  lightGridBg: {
    backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)' as any,
    backgroundSize: '24px 24px' as any,
  },
  darkGridBg: {
    backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)' as any,
    backgroundSize: '24px 24px' as any,
  },
  floatingControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backdropFilter: 'blur(10px)',
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.1
  },
  toolGroup: {
    flexDirection: 'row',
    gap: 6
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)'
  },
  activeBtn: {
    backgroundColor: '#6366f1'
  },
  activeGridBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  subBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  activeSubBtn: {
    borderWidth: 1,
    borderColor: '#6366f1'
  },
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 120,
    gap: 4,
    justifyContent: 'center'
  },
  colorBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  activeColorBox: {
    borderColor: '#000',
    transform: [{ scale: 1.25 }]
  },
  sizePickerContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sizeOption: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  activeSizeOption: {
    borderWidth: 1,
    borderColor: '#6366f1'
  },
  zoomIndicator: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  lightText: {
    color: '#475569'
  },
  darkText: {
    color: '#94a3b8'
  },
  toastGuide: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: '-50%' } as any],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  toastText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  handwritingBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    shadowOpacity: 0.15,
    elevation: 8,
  },
  lightBannerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(0,0,0,0.08)'
  },
  darkBannerCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255,255,255,0.08)'
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 4
  },
  bannerLangBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)'
  },
  activeBannerLangBtn: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1'
  },
  bannerLangText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6366f1'
  },
  activeBannerLangText: {
    color: '#ffffff'
  },
  bannerActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  convertBtn: {
    backgroundColor: '#818cf8',
  },
  clearBtn: {
    backgroundColor: '#ef4444',
  },
  disabledBtn: {
    opacity: 0.4
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  }
});
export default BoardCanvas;
