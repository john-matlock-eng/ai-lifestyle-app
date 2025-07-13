// EmotionWheel.tsx - Improved version with better readability and zoom
import React, { useState, useRef, useEffect } from 'react';
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
}

const EmotionWheel: React.FC<EmotionWheelProps> = ({ 
  selectedEmotions, 
  onEmotionToggle,
  className = '' 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [wheelSize, setWheelSize] = useState(800); // Increased default size
  const [zoomLevel, setZoomLevel] = useState(1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; emotion: Emotion } | null>(null);
  
  // Reset zoom to default
  const resetZoom = () => {
    setZoomLevel(1);
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
  
  // Handle escape key to reset zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetZoom();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle click outside to reset zoom
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        resetZoom();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        emotion
      });
    }
    setHoveredEmotion(emotion.id);
  };
  
  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredEmotion(null);
  };
  
  const coreEmotions = getCoreEmotions();
  const coreAngleSize = 360 / coreEmotions.length;
  
  return (
    <div ref={containerRef} className={`emotion-wheel-container relative ${className}`}>
      {/* Zoom controls - positioned outside the zoomable area */}
      <div className="emotion-wheel-zoom-controls absolute -top-12 right-0 z-20 flex gap-2">
        <button
          onClick={() => setZoomLevel(Math.min(zoomLevel + 0.1, 1.5))}
          className="p-2 rounded-lg bg-surface hover:bg-surface-hover shadow-md transition-colors"
          title="Zoom in"
          disabled={zoomLevel >= 1.5}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomLevel(Math.max(zoomLevel - 0.1, 0.8))}
          className="p-2 rounded-lg bg-surface hover:bg-surface-hover shadow-md transition-colors"
          title="Zoom out"
          disabled={zoomLevel <= 0.8}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetZoom}
          className="p-2 rounded-lg bg-surface hover:bg-surface-hover shadow-md transition-colors"
          title="Reset zoom (ESC)"
          disabled={zoomLevel === 1}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      
      {/* SVG Container with zoom */}
      <div 
        className="emotion-wheel-zoom overflow-hidden rounded-lg bg-surface"
        style={{ 
          width: wheelSize,
          height: wheelSize,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center',
          transition: 'transform 0.2s ease-in-out'
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
                  onClick={() => onEmotionToggle(emotion.id)}
                  onMouseEnter={(e) => handleMouseEnter(e, emotion)}
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
                    onClick={() => onEmotionToggle(emotion.id)}
                    onMouseEnter={(e) => handleMouseEnter(e, emotion)}
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
                      onClick={() => onEmotionToggle(emotion.id)}
                      onMouseEnter={(e) => handleMouseEnter(e, emotion)}
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
      
      {/* Tooltip */}
      {tooltip && (
        <div
          className="emotion-tooltip absolute z-20 px-3 py-2 bg-surface border border-surface-muted rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{getEmotionEmoji(tooltip.emotion.id)}</span>
            <span className="font-medium">{tooltip.emotion.label}</span>
          </div>
          <div className="text-xs text-muted mt-1">
            Click to {selectedEmotions.includes(tooltip.emotion.id) ? 'deselect' : 'select'}
          </div>
        </div>
      )}
      
      {/* Selected emotions display */}
      {selectedEmotions.length > 0 && (
        <div className="mt-4 p-3 bg-surface rounded-lg border border-surface-muted">
          <p className="text-sm font-medium mb-2">Selected emotions:</p>
          <div className="flex flex-wrap gap-2">
            {selectedEmotions.map(emotionId => {
              const emotion = getEmotionById(emotionId);
              if (!emotion) return null;
              
              return (
                <span
                  key={emotionId}
                  className="emotion-pill inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: emotion.color + '20',
                    color: emotion.color,
                    border: `1px solid ${emotion.color}`
                  }}
                >
                  <span>{getEmotionEmoji(emotionId)}</span>
                  {emotion.label}
                  <button
                    onClick={() => onEmotionToggle(emotionId)}
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