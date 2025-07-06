import React from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Legend,
  ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';

interface TrendDataPoint {
  date: Date;
  value: number;
  projected?: boolean;
}

interface TrendLineProps {
  data: TrendDataPoint[];
  startValue: number;
  targetValue: number;
  targetDate: Date;
  unit: string;
  direction: 'increase' | 'decrease';
  color?: string;
  height?: number;
  showProjection?: boolean;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  actual?: number;
  ideal?: number;
  projected?: number;
  fullDate: Date;
}

export const TrendLine: React.FC<TrendLineProps> = ({
  data,
  startValue,
  targetValue,
  targetDate,
  unit,
  direction,
  color = '#10B981',
  height = 350,
  showProjection = true,
  className = '',
}) => {
  const now = new Date();
  const daysTotal = Math.ceil((targetDate.getTime() - data[0].date.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - data[0].date.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate current value and trend
  const currentValue = data[data.length - 1].value;
  const totalChange = Math.abs(targetValue - startValue);
  const currentChange = Math.abs(currentValue - startValue);
  const progressPercentage = (currentChange / totalChange) * 100;
  
  // Calculate if on track
  const expectedProgress = (daysElapsed / daysTotal) * 100;
  const isOnTrack = direction === 'increase' 
    ? progressPercentage >= expectedProgress - 10
    : progressPercentage >= expectedProgress - 10;
  
  // Calculate projection
  const averageChangePerDay = data.length > 1 
    ? (currentValue - data[0].value) / daysElapsed
    : 0;
  const projectedValue = currentValue + (averageChangePerDay * daysRemaining);
  const willMeetTarget = direction === 'increase'
    ? projectedValue >= targetValue
    : projectedValue <= targetValue;
  
  // Prepare chart data
  const chartData: ChartDataPoint[] = data.map(point => ({
    date: point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    actual: point.value,
    fullDate: point.date,
  }));
  
  // Add ideal path
  const idealPath = [
    { date: data[0].date, value: startValue },
    { date: targetDate, value: targetValue },
  ].map(point => ({
    date: point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    ideal: point.value,
    fullDate: point.date,
  }));
  
  // Add projection if enabled
  if (showProjection && data.length > 0) {
    const projectionData = [
      { 
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        projected: currentValue,
        fullDate: now,
      },
      { 
        date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        projected: projectedValue,
        fullDate: targetDate,
      },
    ];
    
    // Merge projection data
    projectionData.forEach(point => {
      const existing = chartData.find(d => d.date === point.date);
      if (existing) {
        existing.projected = point.projected;
      } else {
        chartData.push(point);
      }
    });
  }
  
  // Merge ideal path
  idealPath.forEach(point => {
    const existing = chartData.find(d => d.date === point.date);
    if (existing) {
      existing.ideal = point.ideal;
    } else {
      chartData.push({ date: point.date, ideal: point.ideal, fullDate: point.fullDate });
    }
  });
  
  // Sort by date
  chartData.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  
  // Custom tooltip
  interface TooltipPayload {
    payload: { date: string; actual?: number; ideal?: number; projected?: number; fullDate: Date };
    value: number;
    name: string;
    stroke: string;
  }
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{data.date}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.stroke }}>
              {entry.name}: {entry.value?.toFixed(1)} {unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom dot
  interface DotPayload {
    date: string;
    actual?: number;
    ideal?: number;
    projected?: number;
    fullDate: Date;
  }
  const CustomDot = (props: { cx?: number; cy?: number; payload?: DotPayload; dataKey?: string }) => {
    const { cx, cy, payload, dataKey } = props;
    
    if (!cx || !cy || !payload || dataKey !== 'actual' || payload.actual === undefined) {
      return null;
    }
    
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="white" strokeWidth={2} />;
  };

  return (
    <div className={`bg-white rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Progress Trend</h3>
          <p className="text-sm text-gray-600">
            {direction === 'increase' ? 'Increasing' : 'Decreasing'} from {startValue} to {targetValue} {unit}
          </p>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isOnTrack ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {isOnTrack ? 'On Track' : 'Behind Schedule'}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Current</p>
          <p className="text-xl font-bold" style={{ color }}>
            {currentValue.toFixed(1)} {unit}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {direction === 'increase' ? '+' : '-'}{Math.abs(currentValue - startValue).toFixed(1)}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Target</p>
          <p className="text-xl font-bold text-gray-900">
            {targetValue} {unit}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            in {daysRemaining} days
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Projected</p>
          <p className={`text-xl font-bold ${willMeetTarget ? 'text-green-600' : 'text-red-600'}`}>
            {projectedValue.toFixed(1)} {unit}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {willMeetTarget ? 'Will meet target' : 'May miss target'}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
            domain={['dataMin - 5%', 'dataMax + 5%']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          
          {/* Today line */}
          <ReferenceLine 
            x={now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            stroke="#6B7280" 
            strokeDasharray="3 3"
            label={{ value: "Today", position: "top", style: { fontSize: 12 } }}
          />
          
          {/* Target point */}
          <ReferenceDot
            x={targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            y={targetValue}
            r={6}
            fill={willMeetTarget ? color : '#EF4444'}
            stroke="white"
            strokeWidth={2}
          />
          
          {/* Ideal path */}
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#E5E7EB"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Ideal Path"
            connectNulls
          />
          
          {/* Actual progress */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke={color}
            strokeWidth={3}
            dot={<CustomDot dataKey="actual" />}
            name="Actual"
            animationDuration={1000}
            animationEasing="ease-out"
          />
          
          {/* Projection */}
          {showProjection && (
            <Line
              type="monotone"
              dataKey="projected"
              stroke={willMeetTarget ? color : '#EF4444'}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Projected"
              opacity={0.7}
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Insights */}
      <div className="mt-6 space-y-3">
        {!willMeetTarget && (
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Adjustment Needed</p>
              <p className="text-sm text-red-700">
                At current rate, you'll {direction === 'increase' ? 'only reach' : 'only reduce to'}{' '}
                {projectedValue.toFixed(1)} {unit} by {targetDate.toLocaleDateString()}.
                {direction === 'increase' 
                  ? ` You need to increase by ${((targetValue - currentValue) / daysRemaining).toFixed(1)} ${unit} per day.`
                  : ` You need to decrease by ${((currentValue - targetValue) / daysRemaining).toFixed(1)} ${unit} per day.`}
              </p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Time Elapsed</p>
              <p className="text-sm font-medium text-gray-900">
                {daysElapsed} / {daysTotal} days ({Math.round((daysElapsed / daysTotal) * 100)}%)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {direction === 'increase' ? (
                <TrendingUp className="h-5 w-5 text-gray-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Average Daily Change</p>
              <p className="text-sm font-medium text-gray-900">
                {averageChangePerDay >= 0 ? '+' : ''}{averageChangePerDay.toFixed(2)} {unit}/day
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
