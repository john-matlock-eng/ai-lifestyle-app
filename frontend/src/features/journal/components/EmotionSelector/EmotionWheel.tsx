// EmotionWheel.tsx - Improved version with better readability and zoom
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { 
  getCoreEmotions, 
  getSecondaryEmotions, 
  getTertiaryEmotions,
  getEmotionById,
  getEmotionEmoji,
  type Emotion
} from './emotionData';

interface EmotionWheelProps {
  selectedEmotions: string[];
  onEmotionToggle: (emotionId: string) => void;
  className?: string;
  hierarchicalSelection?: boolean;
}

const EmotionWheel: React.FC<EmotionWheelProps> = ({ 
  selectedEmotions, 
  onEmotionToggle,
  className = '',
  hierarchicalSelection = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [wheelSize, setWheelSize] = useState(800); // Increased default size
  const [zoomLevel, setZoomLevel] = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; emotion: Emotion | null } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanOffset, setLastPanOffset] = useState({ x: 0, y: 0 });
  const currentHoveredEmotionRef = useRef<Emotion | null>(null);
  const hasDraggedRef = useRef(false);
  const clickStartTimeRef = useRef(0);
  const initialClickPosRef = useRef({ x: 0, y: 0 });
  
  // Reset zoom and pan to default
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setLastPanOffset({ x: 0, y: 0 });
  };
  
  // Handle emotion selection with hierarchical logic
  const handleEmotionSelect = (emotionId: string) => {
    // Don't select if we just finished dragging
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    
    const emotion = getEmotionById(emotionId);
    if (!emotion) return;
    
    if (selectedEmotions.includes(emotionId)) {
      // Deselecting - just remove this emotion
      onEmotionToggle(emotionId);
    } else {
      // Selecting - check if we need to select parents
      if (hierarchicalSelection && emotion.parent) {
        // Get all parent emotions
        const parents: string[] = [];
        let currentId: string | undefined = emotion.parent;
        
        while (currentId) {
          if (!selectedEmotions.includes(currentId)) {
            parents.push(currentId);
          }
          const parentEmotion = getEmotionById(currentId);
          currentId = parentEmotion?.parent;
        }
        
        // Select parents first (in reverse order - from core to specific)
        parents.reverse().forEach(parentId => {
          onEmotionToggle(parentId);
        });
      }
      
      // Then select the clicked emotion
      onEmotionToggle(emotionId);
    }
  };
  
  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxSize = Math.min(containerWidth - 40, 900); // Increased max size
        setWheelSize(maxSize);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Handle escape key to reset view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetView();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle click outside to reset view
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && !isPanning) {
        resetView();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanning]);
  
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const innerRadius = wheelSize * 0.12;
  const middleRadius = wheelSize * 0.30; // Slightly larger
  const outerRadius = wheelSize * 0.48; // Slightly larger
  
  // Calculate path for a segment
  const createPath = (
    startAngle: number, 
    endAngle: number, 
    innerR: number, 
    outerR: number
  ) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + innerR * Math.cos(startAngleRad);
    const y1 = centerY + innerR * Math.sin(startAngleRad);
    const x2 = centerX + outerR * Math.cos(startAngleRad);
    const y2 = centerY + outerR * Math.sin(startAngleRad);
    const x3 = centerX + outerR * Math.cos(endAngleRad);
    const y3 = centerY + outerR * Math.sin(endAngleRad);
    const x4 = centerX + innerR * Math.cos(endAngleRad);
    const y4 = centerY + innerR * Math.sin(endAngleRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `
      M ${x1} ${y1}
      L ${x2} ${y2}
      A ${outerR} ${outerR} 0 ${largeArc} 1 ${x3} ${y3}
      L ${x4} ${y4}
      A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1} ${y1}
    `;
  };
  
  // Calculate text position and optimal font size
  const getTextPosition = (startAngle: number, endAngle: number, radius: number, level: 'core' | 'secondary' | 'tertiary') => {
    const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
    const x = centerX + radius * Math.cos(midAngle);
    const y = centerY + radius * Math.sin(midAngle);
    const rotation = (startAngle + endAngle) / 2;
    
    // Adjust text orientation for readability
    let textRotation = rotation;
    let anchor = 'middle';
    
    if (level !== 'core') {
      const normalizedRotation = ((rotation + 90) % 360 + 360) % 360;
      if (normalizedRotation > 180) {
        textRotation = rotation + 180;
        anchor = 'middle';
      }
    }
    
    // Dynamic font sizes based on level and zoom
    const baseFontSizes = {
      core: wheelSize * 0.018,
      secondary: wheelSize * 0.014,
      tertiary: wheelSize * 0.011
    };
    
    return {
      x,
      y,
      rotation: textRotation,
      anchor,
      fontSize: baseFontSizes[level] * zoomLevel
    };
  };
  
  // Handle mouse events for tooltip
  const handleMouseEnter = (e: React.MouseEvent, emotion: Emotion) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      currentHoveredEmotionRef.current = emotion;
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        emotion
      });
    }
    setHoveredEmotion(emotion.id);
  };
  
  const handleMouseMove = (e: React.MouseEvent, emotion: Emotion) => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update emotion if it changed
      if (currentHoveredEmotionRef.current?.id !== emotion.id) {
        currentHoveredEmotionRef.current = emotion;
        setHoveredEmotion(emotion.id);
      }
      
      setTooltip({
        x,
        y,
        emotion
      });
    }
  };
  
  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredEmotion(null);
    currentHoveredEmotionRef.current = null;
  };
  
  // Pan handlers
  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Record start time and position
    clickStartTimeRef.current = Date.now();
    hasDraggedRef.current = false;
    initialClickPosRef.current = { x: clientX, y: clientY };
    
    if (zoomLevel <= 1) return; // No panning when not zoomed
    
    setIsPanning(true);
    setDragStart({ x: clientX, y: clientY });
    setLastPanOffset({ ...panOffset });
    
    // Prevent text selection while dragging
    e.preventDefault();
  };
  
  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Check if we've moved enough to consider it a drag (5px threshold)
    const moveDistance = Math.sqrt(
      Math.pow(clientX - initialClickPosRef.current.x, 2) + 
      Math.pow(clientY - initialClickPosRef.current.y, 2)
    );
    
    if (moveDistance > 5) {
      hasDraggedRef.current = true;
    }
    
    if (!isPanning || zoomLevel <= 1) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Calculate new pan offset with boundaries
    const maxPan = (wheelSize * (zoomLevel - 1)) / 2;
    const newX = Math.max(-maxPan, Math.min(maxPan, lastPanOffset.x + deltaX));
    const newY = Math.max(-maxPan, Math.min(maxPan, lastPanOffset.y + deltaY));
    
    setPanOffset({ x: newX, y: newY });
  };
  
  const handlePanEnd = () => {
    setIsPanning(false);
    
    // If it was a quick click (less than 200ms) and no drag, allow selection
    const clickDuration = Date.now() - clickStartTimeRef.current;
    if (clickDuration < 200 && !hasDraggedRef.current) {
      hasDraggedRef.current = false;
    }
  };
  
  // Mouse wheel zoom
  const handleWheel = useCallback((e: Event) => {
    const wheelEvent = e as WheelEvent;
    if (!containerRef.current?.contains(e.target as Node)) return;
    
    wheelEvent.preventDefault();
    const delta = wheelEvent.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.8, Math.min(4, zoomLevel + delta));
    
    // Adjust pan offset when zooming to keep centered
    if (newZoom !== zoomLevel) {
      const scale = newZoom / zoomLevel;
      setPanOffset(prev => ({
        x: prev.x * scale,
        y: prev.y * scale
      }));
      setLastPanOffset(prev => ({
        x: prev.x * scale,
        y: prev.y * scale
      }));
    }
    
    setZoomLevel(newZoom);
  }, [zoomLevel]);
  
  // Add wheel event listener with passive: false
  useEffect(() => {
    const element = containerRef.current?.querySelector('.emotion-wheel-zoom');
    if (!element) return;
    
    element.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  const coreEmotions = getCoreEmotions();
  const coreAngleSize = 360 / coreEmotions.length;
  
  return (
    <div 
      ref={containerRef} 
      className={`emotion-wheel-container relative ${className}`}
      data-empty={selectedEmotions.length === 0}
    >
      {/* Zoom controls - positioned outside the zoomable area */}
      <div className="emotion-wheel-zoom-controls absolute -top-12 right-0 z-20 flex gap-2">
        <button
          onClick={() => {
            const newZoom = Math.min(zoomLevel + 0.2, 4);
            setZoomLevel(newZoom);
          }}
          className="p-2 rounded-lg bg-surface hover:bg-surface-hover shadow-md transition-colors"
          title="Zoom in (scroll to zoom)"
          disabled={zoomLevel >= 4}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(zoomLevel - 0.2, 0.8);
            setZoomLevel(newZoom);
            // Adjust pan when zooming out
            if (newZoom < zoomLevel) {
              const scale = newZoom / zoomLevel;
              setPanOffset({
                x: panOffset.x * scale,
                y: panOffset.y * scale
              });
              setLastPanOffset({
                x: panOffset.x * scale,
                y: panOffset.y * scale
              });
            }
          }}
          className="p-2 rounded-lg bg-surface hover:bg-surface-hover shadow-md transition-colors"
          title="Zoom out (scroll to zoom)"
          disabled={zoomLevel <= 0.8}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 rounded-lg bg-surface hover:bg-surface-hover shadow-md transition-colors"
          title="Reset view (ESC)"
          disabled={zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      
      {/* SVG Container with zoom and pan */}
      <div 
        className="emotion-wheel-zoom overflow-hidden rounded-lg bg-surface relative"
        style={{ 
          width: wheelSize,
          height: wheelSize,
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onTouchStart={handlePanStart}
        onTouchMove={handlePanMove}
        onTouchEnd={handlePanEnd}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center',
            transition: isPanning ? 'none' : 'transform 0.2s ease-in-out',
            width: '100%',
            height: '100%'
          }}
        >
        <svg 
          ref={svgRef}
          width={wheelSize} 
          height={wheelSize} 
          className="cursor-pointer select-none"
          style={{ background: 'var(--color-background)' }}
        >
          {/* Add subtle grid for better visual organization */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-surface-muted)" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          
          {/* Instructions */}
          {zoomLevel <= 1.2 && selectedEmotions.length === 0 && (
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              className="emotion-wheel-hint fill-accent text-sm font-medium"
              style={{ userSelect: 'none' }}
            >
              Start by selecting a core emotion
            </text>
          )}
          
          {/* Pan/Zoom instructions when zoomed */}
          {zoomLevel > 1.2 && (
            <text
              x={centerX}
              y={20}
              textAnchor="middle"
              className="fill-muted text-xs"
              style={{ userSelect: 'none' }}
            >
              Drag to pan • Scroll to zoom • ESC to reset
            </text>
          )}
          
          {/* Core emotions (center) */}
          {coreEmotions.map((emotion, index) => {
            const startAngle = index * coreAngleSize - 90;
            const endAngle = (index + 1) * coreAngleSize - 90;
            const isSelected = selectedEmotions.includes(emotion.id);
            const isHovered = hoveredEmotion === emotion.id;
            const textPos = getTextPosition(startAngle, endAngle, innerRadius * 0.6, 'core');
            
            return (
              <g key={emotion.id}>
                <path
                  d={createPath(startAngle, endAngle, 0, innerRadius)}
                  fill={emotion.color}
                  stroke="var(--color-background)"
                  strokeWidth="2"
                  opacity={isSelected ? 1 : (isHovered ? 0.9 : 0.8)}
                  onClick={() => handleEmotionSelect(emotion.id)}
                  onMouseEnter={(e) => handleMouseEnter(e, emotion)}
                  onMouseMove={(e) => handleMouseMove(e, emotion)}
                  onMouseLeave={handleMouseLeave}
                  className={`emotion-segment emotion-segment-core transition-all duration-200 ${selectedEmotions.length === 0 ? 'cursor-pointer' : ''}`}
                  style={{ 
                    filter: isSelected ? 'brightness(1.1)' : 'none',
                    strokeWidth: selectedEmotions.length === 0 ? '3' : '2'
                  }}
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                  textAnchor={textPos.anchor}
                  dominantBaseline="middle"
                  className="emotion-text-core fill-white font-semibold pointer-events-none"
                  style={{ fontSize: `${textPos.fontSize}px` }}
                >
                  {emotion.label}
                </text>
              </g>
            );
          })}
          
          {/* Secondary emotions */}
          {coreEmotions.map((coreEmotion, coreIndex) => {
            const secondaryEmotions = getSecondaryEmotions(coreEmotion.id);
            const coreStartAngle = coreIndex * coreAngleSize - 90;
            const secondaryAngleSize = coreAngleSize / secondaryEmotions.length;
            
            return secondaryEmotions.map((emotion, secIndex) => {
              const startAngle = coreStartAngle + secIndex * secondaryAngleSize;
              const endAngle = startAngle + secondaryAngleSize;
              const isSelected = selectedEmotions.includes(emotion.id);
              const isHovered = hoveredEmotion === emotion.id;
              const textPos = getTextPosition(startAngle, endAngle, (innerRadius + middleRadius) / 2, 'secondary');
              
              return (
                <g key={emotion.id}>
                  <path
                    d={createPath(startAngle, endAngle, innerRadius, middleRadius)}
                    fill={emotion.color}
                    stroke="var(--color-background)"
                    strokeWidth="1.5"
                    opacity={isSelected ? 1 : (isHovered ? 0.85 : 0.7)}
                    onClick={() => handleEmotionSelect(emotion.id)}
                    onMouseEnter={(e) => handleMouseEnter(e, emotion)}
                    onMouseMove={(e) => handleMouseMove(e, emotion)}
                    onMouseLeave={handleMouseLeave}
                    className="emotion-segment transition-all duration-200"
                    style={{ filter: isSelected ? 'brightness(1.1)' : 'none' }}
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                    textAnchor={textPos.anchor}
                    dominantBaseline="middle"
                    className="emotion-text-secondary font-medium pointer-events-none"
                    fill={isHovered || isSelected ? 'var(--color-theme)' : 'var(--color-muted)'}
                    style={{ fontSize: `${textPos.fontSize}px` }}
                  >
                    {emotion.label}
                  </text>
                </g>
              );
            });
          })}
          
          {/* Tertiary emotions */}
          {coreEmotions.map((coreEmotion, coreIndex) => {
            const secondaryEmotions = getSecondaryEmotions(coreEmotion.id);
            const coreStartAngle = coreIndex * coreAngleSize - 90;
            const secondaryAngleSize = coreAngleSize / secondaryEmotions.length;
            
            return secondaryEmotions.map((secEmotion, secIndex) => {
              const tertiaryEmotions = getTertiaryEmotions(secEmotion.id);
              if (tertiaryEmotions.length === 0) return null;
              
              const secStartAngle = coreStartAngle + secIndex * secondaryAngleSize;
              const tertiaryAngleSize = secondaryAngleSize / tertiaryEmotions.length;
              
              return tertiaryEmotions.map((emotion, terIndex) => {
                const startAngle = secStartAngle + terIndex * tertiaryAngleSize;
                const endAngle = startAngle + tertiaryAngleSize;
                const isSelected = selectedEmotions.includes(emotion.id);
                const isHovered = hoveredEmotion === emotion.id;
                const textPos = getTextPosition(startAngle, endAngle, (middleRadius + outerRadius) / 2, 'tertiary');
                
                return (
                  <g key={emotion.id}>
                    <path
                      d={createPath(startAngle, endAngle, middleRadius, outerRadius)}
                      fill={emotion.color}
                      stroke="var(--color-background)"
                      strokeWidth="1"
                      opacity={isSelected ? 1 : (isHovered ? 0.8 : 0.6)}
                      onClick={() => handleEmotionSelect(emotion.id)}
                      onMouseEnter={(e) => handleMouseEnter(e, emotion)}
                      onMouseMove={(e) => handleMouseMove(e, emotion)}
                      onMouseLeave={handleMouseLeave}
                      className="emotion-segment transition-all duration-200"
                      style={{ filter: isSelected ? 'brightness(1.1)' : 'none' }}
                    />
                    {/* Only show text if zoomed in enough or hovered */}
                    {(zoomLevel > 1.1 || isHovered || isSelected) && (
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                        textAnchor={textPos.anchor}
                        dominantBaseline="middle"
                        className="emotion-text-tertiary pointer-events-none"
                        fill={isHovered || isSelected ? 'var(--color-theme)' : 'var(--color-muted)'}
                        style={{ fontSize: `${textPos.fontSize}px` }}
                      >
                        {emotion.label}
                      </text>
                    )}
                  </g>
                );
              });
            });
          })}
        </svg>
        </div>
      </div>
      
      {/* Tooltip */}
      {tooltip && tooltip.emotion && (() => {
        const currentEmotion = tooltip.emotion;
        
        // Calculate tooltip dimensions (approximate)
        const tooltipWidth = 200; // Approximate width with padding
        const tooltipHeight = 70; // Approximate height with padding
        const offset = 15; // Distance from cursor
        const padding = 10; // Minimum distance from edges
        
        // Get container dimensions
        const containerWidth = wheelSize;
        const containerHeight = wheelSize;
        
        // Default position (to the right and above cursor)
        let left = tooltip.x + offset;
        let top = tooltip.y - tooltipHeight - offset;
        
        // Check if tooltip would go off the right edge
        if (left + tooltipWidth > containerWidth - padding) {
          // Position to the left of cursor instead
          left = tooltip.x - tooltipWidth - offset;
        }
        
        // Check if tooltip would go off the left edge
        if (left < padding) {
          // Center horizontally on cursor
          left = tooltip.x - tooltipWidth / 2;
          // But still respect boundaries
          left = Math.max(padding, Math.min(left, containerWidth - tooltipWidth - padding));
        }
        
        // Check if tooltip would go off the top edge
        if (top < padding) {
          // Position below cursor instead
          top = tooltip.y + offset;
        }
        
        // Check if tooltip would go off the bottom edge
        if (top + tooltipHeight > containerHeight - padding) {
          // Position above cursor, but ensure it fits
          top = Math.min(tooltip.y - tooltipHeight - offset, containerHeight - tooltipHeight - padding);
        }
        
        // Final boundary checks
        left = Math.max(padding, Math.min(left, containerWidth - tooltipWidth - padding));
        top = Math.max(padding, Math.min(top, containerHeight - tooltipHeight - padding));
        
        return (
          <div
            className="emotion-tooltip absolute z-50 px-3 py-2 bg-surface border border-surface-muted rounded-lg shadow-xl pointer-events-none"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: 'max-content',
              maxWidth: `${tooltipWidth}px`
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{getEmotionEmoji(currentEmotion.id)}</span>
              <span className="font-medium">{currentEmotion.label}</span>
            </div>
            <div className="text-xs text-muted mt-1">
              Click to {selectedEmotions.includes(currentEmotion.id) ? 'deselect' : 'select'}
            </div>
          </div>
        );
      })()}
      
      {/* Selected emotions display with hierarchy */}
      {selectedEmotions.length > 0 && (
        <div className="mt-4 p-3 bg-surface rounded-lg border border-surface-muted">
          <p className="text-sm font-medium mb-2">Selected emotions:</p>
          <div className="space-y-2">
            {/* Group by core emotions */}
            {getCoreEmotions()
              .filter(core => selectedEmotions.includes(core.id))
              .map(coreEmotion => {
                const selectedSecondary = getSecondaryEmotions(coreEmotion.id)
                  .filter(e => selectedEmotions.includes(e.id));
                const selectedTertiary = selectedSecondary.flatMap(sec => 
                  getTertiaryEmotions(sec.id).filter(e => selectedEmotions.includes(e.id))
                );
                
                return (
                  <div key={coreEmotion.id} className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Core emotion */}
                      <span
                        className="emotion-pill emotion-pill-core inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ 
                          backgroundColor: coreEmotion.color + '30',
                          color: coreEmotion.color,
                          border: `2px solid ${coreEmotion.color}`
                        }}
                      >
                        <span>{getEmotionEmoji(coreEmotion.id)}</span>
                        {coreEmotion.label}
                        <button
                          onClick={() => handleEmotionSelect(coreEmotion.id)}
                          className="ml-1 hover:opacity-70 transition-opacity"
                          title="Remove emotion"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                      
                      {/* Secondary emotions */}
                      {selectedSecondary.map(emotion => (
                        <span
                          key={emotion.id}
                          className="emotion-pill inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ml-2"
                          style={{ 
                            backgroundColor: emotion.color + '20',
                            color: emotion.color,
                            border: `1px solid ${emotion.color}`
                          }}
                        >
                          <span className="text-muted">›</span>
                          <span>{getEmotionEmoji(emotion.id)}</span>
                          {emotion.label}
                          <button
                            onClick={() => handleEmotionSelect(emotion.id)}
                            className="ml-1 hover:opacity-70 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    {/* Tertiary emotions */}
                    {selectedTertiary.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap ml-8">
                        {selectedTertiary.map(emotion => (
                          <span
                            key={emotion.id}
                            className="emotion-pill inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                            style={{ 
                              backgroundColor: emotion.color + '15',
                              color: emotion.color,
                              border: `1px solid ${emotion.color}80`
                            }}
                          >
                            <span className="text-muted">››</span>
                            <span>{getEmotionEmoji(emotion.id)}</span>
                            {emotion.label}
                            <button
                              onClick={() => handleEmotionSelect(emotion.id)}
                              className="ml-1 hover:opacity-70 transition-opacity"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            
            {/* Show orphaned emotions (shouldn't happen with hierarchical selection) */}
            {selectedEmotions
              .filter(id => {
                const emotion = getEmotionById(id);
                return emotion && emotion.level !== 'core' && 
                  (!emotion.parent || !selectedEmotions.includes(emotion.parent));
              })
              .map(emotionId => {
                const emotion = getEmotionById(emotionId);
                if (!emotion) return null;
                return (
                  <span
                    key={emotionId}
                    className="emotion-pill inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs opacity-60"
                    style={{ 
                      backgroundColor: emotion.color + '10',
                      color: emotion.color,
                      border: `1px dashed ${emotion.color}`
                    }}
                  >
                    <span>{getEmotionEmoji(emotionId)}</span>
                    {emotion.label}
                    <span className="text-xs ml-1">(orphaned)</span>
                    <button
                      onClick={() => handleEmotionSelect(emotionId)}
                      className="ml-1 hover:opacity-70 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionWheel;