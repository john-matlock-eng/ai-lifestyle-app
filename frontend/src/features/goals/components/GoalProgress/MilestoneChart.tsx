import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Calendar, Trophy } from 'lucide-react';

interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

interface MilestoneChartProps {
  data: DataPoint[];
  targetValue: number;
  currentValue: number;
  unit: string;
  color?: string;
  height?: number;
  showTarget?: boolean;
  showMilestones?: boolean;
  className?: string;
}

export const MilestoneChart: React.FC<MilestoneChartProps> = ({
  data,
  targetValue,
  currentValue,
  unit,
  color = '#8B5CF6',
  height = 300,
  showTarget = true,
  showMilestones = true,
  className = '',
}) => {
  // Transform data for Recharts
  const chartData = data.map(point => ({
    date: point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: point.value,
    label: point.label,
  }));

  // Calculate milestones (25%, 50%, 75%)
  const milestones = [0.25, 0.5, 0.75].map(percentage => ({
    percentage,
    value: targetValue * percentage,
    achieved: currentValue >= targetValue * percentage,
  }));

  // Calculate progress percentage
  const progressPercentage = (currentValue / targetValue) * 100;

  // Custom tooltip
  interface TooltipPayload {
    payload: { date: string; value: number };
    value: number;
  }
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{payload[0].payload.date}</p>
          <p className="text-sm" style={{ color }}>
            {payload[0].value.toLocaleString()} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom dot for milestones
  interface DotPayload {
    value: number;
    date: string;
  }
  const CustomDot = (props: { cx?: number; cy?: number; payload?: DotPayload }) => {
    const { cx, cy, payload } = props;
    const milestone = milestones.find(m => Math.abs(payload.value - m.value) < 0.1);
    
    if (milestone) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2} />
          {milestone.achieved && (
            <Trophy 
              x={cx - 8} 
              y={cy - 20} 
              size={16} 
              fill={color}
              className="animate-bounce"
            />
          )}
        </g>
      );
    }
    
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />;
  };

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Progress Over Time</h3>
          <p className="text-sm text-gray-600">
            {currentValue.toLocaleString()} / {targetValue.toLocaleString()} {unit}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color }}>
            {progressPercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500">Complete</p>
        </div>
      </div>
      
      {/* Milestones */}
      {showMilestones && (
        <div className="flex items-center justify-between mb-4 px-2">
          {milestones.map((milestone, index) => (
            <div
              key={index}
              className={`flex items-center gap-1 ${
                milestone.achieved ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-medium">
                {milestone.percentage * 100}%
              </span>
            </div>
          ))}
          <div
            className={`flex items-center gap-1 ${
              progressPercentage >= 100 ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-medium">100%</span>
          </div>
        </div>
      )}
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
            domain={[0, 'dataMax + 10%']}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Target line */}
          {showTarget && (
            <ReferenceLine 
              y={targetValue} 
              stroke={color} 
              strokeDasharray="5 5"
              opacity={0.7}
              label={{ value: "Target", position: "right", style: { fill: color } }}
            />
          )}
          
          {/* Milestone lines */}
          {showMilestones && milestones.map((milestone, index) => (
            <ReferenceLine
              key={index}
              y={milestone.value}
              stroke={milestone.achieved ? '#10B981' : '#E5E7EB'}
              strokeDasharray="3 3"
              opacity={0.5}
            />
          ))}
          
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorGradient)"
            dot={<CustomDot />}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Started {data[0].date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2" style={{ color }}>
          <TrendingUp className="h-4 w-4" />
          <span className="font-medium">
            +{(currentValue - data[0].value).toLocaleString()} {unit}
          </span>
        </div>
      </div>
    </div>
  );
};

// Simple bar chart variant for milestone progress
interface MilestoneBarProps {
  current: number;
  target: number;
  unit: string;
  label?: string;
  color?: string;
  showPercentage?: boolean;
  className?: string;
}

export const MilestoneBar: React.FC<MilestoneBarProps> = ({
  current,
  target,
  unit,
  label,
  color = '#8B5CF6',
  showPercentage = true,
  className = '',
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  
  return (
    <div className={`space-y-2 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium" style={{ color }}>
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out relative"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
            }}
          >
            {percentage >= 50 && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-white">
                {current.toLocaleString()} / {target.toLocaleString()} {unit}
              </span>
            )}
          </div>
        </div>
        {percentage < 50 && (
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-700">
            {current.toLocaleString()} / {target.toLocaleString()} {unit}
          </span>
        )}
      </div>
    </div>
  );
};
