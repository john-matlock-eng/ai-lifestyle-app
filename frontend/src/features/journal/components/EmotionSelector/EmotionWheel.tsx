// EmotionWheel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  getCoreEmotions, 
  getSecondaryEmotions, 
  getTertiaryEmotions,
  getEmotionById,
  getEmotionEmoji 
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
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [wheelSize, setWheelSize] = useState(600);
  
  // Responsive sizing
  useEffect(() => {
    const handleResize = () => {
      const minDimension = Math.min(window.innerWidth - 40, 600);
      setWheelSize(minDimension);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const innerRadius = wheelSize * 0.12;
  const middleRadius = wheelSize * 0.28;
  const outerRadius = wheelSize * 0.45;
  
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
  
  // Calculate text position for labels
  const getTextPosition = (startAngle: number, endAngle: number, radius: number) => {
    const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
    const x = centerX + radius * Math.cos(midAngle);
    const y = centerY + radius * Math.sin(midAngle);
    const rotation = (startAngle + endAngle) / 2;
    const shouldFlip = rotation > 90 && rotation < 270;
    
    return {
      x,
      y,
      rotation: shouldFlip ? rotation + 180 : rotation,
      anchor: shouldFlip ? 'end' : 'start'
    };
  };
  
  const coreEmotions = getCoreEmotions();
  const coreAngleSize = 360 / coreEmotions.length;
  
  return (
    <div className={`relative ${className}`}>
      <svg 
        ref={svgRef}
        width={wheelSize} 
        height={wheelSize} 
        className="cursor-pointer select-none"
      >
        {/* Core emotions (center) */}
        {coreEmotions.map((emotion, index) => {
          const startAngle = index * coreAngleSize - 90;
          const endAngle = (index + 1) * coreAngleSize - 90;
          const isSelected = selectedEmotions.includes(emotion.id);
          const isHovered = hoveredEmotion === emotion.id;
          
          return (
            <g key={emotion.id}>
              <path
                d={createPath(startAngle, endAngle, 0, innerRadius)}
                fill={emotion.color}
                stroke="white"
                strokeWidth="2"
                opacity={isSelected ? 1 : (isHovered ? 0.8 : 0.7)}
                onClick={() => onEmotionToggle(emotion.id)}
                onMouseEnter={() => setHoveredEmotion(emotion.id)}
                onMouseLeave={() => setHoveredEmotion(null)}
                className="transition-all duration-200"
              />
              <text
                x={centerX}
                y={centerY}
                transform={`rotate(${(startAngle + endAngle) / 2}, ${centerX}, ${centerY})`}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold fill-white pointer-events-none"
                dy={innerRadius * 0.6}
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
            const textPos = getTextPosition(startAngle, endAngle, (innerRadius + middleRadius) / 2);
            
            return (
              <g key={emotion.id}>
                <path
                  d={createPath(startAngle, endAngle, innerRadius, middleRadius)}
                  fill={emotion.color}
                  stroke="white"
                  strokeWidth="1.5"
                  opacity={isSelected ? 1 : (isHovered ? 0.8 : 0.6)}
                  onClick={() => onEmotionToggle(emotion.id)}
                  onMouseEnter={() => setHoveredEmotion(emotion.id)}
                  onMouseLeave={() => setHoveredEmotion(null)}
                  className="transition-all duration-200"
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                  textAnchor={textPos.anchor}
                  dominantBaseline="middle"
                  className="text-[10px] font-medium fill-gray-700 pointer-events-none"
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
              const textPos = getTextPosition(startAngle, endAngle, (middleRadius + outerRadius) / 2);
              
              return (
                <g key={emotion.id}>
                  <path
                    d={createPath(startAngle, endAngle, middleRadius, outerRadius)}
                    fill={emotion.color}
                    stroke="white"
                    strokeWidth="1"
                    opacity={isSelected ? 1 : (isHovered ? 0.8 : 0.5)}
                    onClick={() => onEmotionToggle(emotion.id)}
                    onMouseEnter={() => setHoveredEmotion(emotion.id)}
                    onMouseLeave={() => setHoveredEmotion(null)}
                    className="transition-all duration-200"
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                    textAnchor={textPos.anchor}
                    dominantBaseline="middle"
                    className="text-[9px] fill-gray-600 pointer-events-none"
                  >
                    {emotion.label}
                  </text>
                </g>
              );
            });
          });
        })}
      </svg>
      
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
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
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