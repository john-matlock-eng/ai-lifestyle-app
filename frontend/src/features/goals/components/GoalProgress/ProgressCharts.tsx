import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, 
  BarChart3, PieChart as PieIcon, Target, Info 
} from 'lucide-react';
import type { Goal, GoalActivity, GoalProgress } from '../../types/api.types';
import { GOAL_PATTERN_COLORS } from '../../types/goal.types';

interface ProgressChartsProps {
  goal: Goal;
  activities: GoalActivity[];
  progress: GoalProgress;
  className?: string;
}

type ChartType = 'line' | 'bar' | 'area' | 'radial' | 'pie';
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

const ProgressCharts: React.FC<ProgressChartsProps> = ({
  goal,
  activities,
  progress,
  className = '',
}) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showTarget, setShowTarget] = useState(true);

  const color = GOAL_PATTERN_COLORS[goal.goalPattern];

  // Process activities into chart data based on time range
  const getChartData = () => {
    const now = new Date();
    const rangeMap = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      'all': Infinity,
    };
    
    const daysToShow = rangeMap[timeRange];
    const startDate = daysToShow === Infinity 
      ? new Date(goal.createdAt)
      : new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000);

    // Filter activities within range
    const filteredActivities = activities.filter(
      (activity) => new Date(activity.activityDate) >= startDate
    );

    // Group by day
    const dailyData = new Map<string, { date: string; value: number; activities: number }>();
    
    // Initialize all days in range
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyData.set(dateStr, { date: dateStr, value: 0, activities: 0 });
    }

    // Aggregate activities
    filteredActivities.forEach((activity) => {
      const dateStr = new Date(activity.activityDate).toISOString().split('T')[0];
      const existing = dailyData.get(dateStr) || { date: dateStr, value: 0, activities: 0 };
      existing.value += activity.value;
      existing.activities += 1;
      dailyData.set(dateStr, existing);
    });

    return Array.from(dailyData.values()).map((data) => ({
      ...data,
      formattedDate: new Date(data.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      target: goal.target.value,
    }));
  };

  const chartData = getChartData();

  // Calculate statistics
  const stats = {
    total: activities.reduce((sum, a) => sum + a.value, 0),
    average: activities.length > 0 
      ? activities.reduce((sum, a) => sum + a.value, 0) / activities.length 
      : 0,
    max: Math.max(...activities.map(a => a.value), 0),
    min: activities.length > 0 ? Math.min(...activities.map(a => a.value)) : 0,
    consistency: progress.statistics?.consistency || 0,
  };

  // Pie chart data for activity types
  const activityTypeData = activities.reduce((acc, activity) => {
    const type = activity.activityType;
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const pieColors = {
    progress: '#3B82F6',
    completed: '#10B981',
    skipped: '#F59E0B',
    partial: '#8B5CF6',
  };

  // Radial bar data for progress
  const radialData = [
    {
      name: 'Progress',
      value: progress.progress.percentComplete,
      fill: color,
    },
  ];

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(chartData.length / 10)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={{ fill: color, r: 3 }}
                activeDot={{ r: 6 }}
                name={goal.target.unit}
              />
              {showTarget && (
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#94A3B8" 
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  name="Target"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(chartData.length / 10)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="value" 
                fill={color} 
                radius={[4, 4, 0, 0]}
                name={goal.target.unit}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                interval={Math.floor(chartData.length / 10)}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                fill={`${color}30`}
                strokeWidth={2}
                name={goal.target.unit}
              />
              {showTarget && (
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#94A3B8" 
                  strokeDasharray="5 5"
                  strokeWidth={1}
                  dot={false}
                  name="Target"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'radial':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="60%" 
              outerRadius="90%" 
              data={radialData}
            >
              <RadialBar 
                dataKey="value" 
                cornerRadius={10} 
                fill={color}
                background={{ fill: '#f3f4f6' }}
              />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-3xl font-bold"
                fill="#111827"
              >
                {progress.progress.percentComplete}%
              </text>
              <text 
                x="50%" 
                y="50%" 
                dy={30} 
                textAnchor="middle" 
                className="text-sm"
                fill="#6b7280"
              >
                Complete
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activityTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {activityTypeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={pieColors[entry.name as keyof typeof pieColors] || '#94A3B8'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Chart Controls */}
      <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-[color:var(--surface-muted)] p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-[var(--text)]">Progress Analytics</h2>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Type Selector */}
            <div className="flex bg-[var(--surface-muted)] rounded-lg p-1">
              {[
                { type: 'line' as ChartType, icon: Activity },
                { type: 'bar' as ChartType, icon: BarChart3 },
                { type: 'area' as ChartType, icon: TrendingUp },
                { type: 'radial' as ChartType, icon: Target },
                { type: 'pie' as ChartType, icon: PieIcon },
              ].map(({ type, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`p-2 rounded transition-all ${
                    chartType === type
                      ? 'bg-[var(--surface)] shadow-sm text-[var(--text)]'
                      : 'text-muted hover:text-[var(--text)]'
                  }`}
                  title={`${type} chart`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Time Range Selector */}
            {chartType !== 'radial' && chartType !== 'pie' && (
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-3 py-1.5 text-sm border border-[color:var(--surface-muted)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
            )}

            {/* Show Target Toggle */}
            {(chartType === 'line' || chartType === 'area') && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showTarget}
                  onChange={(e) => setShowTarget(e.target.checked)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-muted">Show target</span>
              </label>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          {activities.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No activity data to display</p>
                <p className="text-sm mt-1">Start logging activities to see your progress</p>
              </div>
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-[color:var(--surface-muted)] p-4">
          <p className="text-sm text-muted mb-1">Total</p>
          <p className="text-2xl font-bold text-[var(--text)]">
            {stats.total.toFixed(1)} <span className="text-sm font-normal">{goal.target.unit}</span>
          </p>
        </div>
        
        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-[color:var(--surface-muted)] p-4">
          <p className="text-sm text-muted mb-1">Average</p>
          <p className="text-2xl font-bold text-[var(--text)]">
            {stats.average.toFixed(1)} <span className="text-sm font-normal">{goal.target.unit}</span>
          </p>
        </div>
        
        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-[color:var(--surface-muted)] p-4">
          <p className="text-sm text-muted mb-1">Best</p>
          <p className="text-2xl font-bold text-[var(--text)]">
            {stats.max.toFixed(1)} <span className="text-sm font-normal">{goal.target.unit}</span>
          </p>
        </div>
        
        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-[color:var(--surface-muted)] p-4">
          <p className="text-sm text-muted mb-1">Consistency</p>
          <p className="text-2xl font-bold text-[var(--text)]">{stats.consistency}%</p>
        </div>
        
        <div className="bg-[var(--surface)] rounded-lg shadow-sm border border-[color:var(--surface-muted)] p-4">
          <p className="text-sm text-muted mb-1">Trend</p>
          <div className="flex items-center gap-2">
            {progress.progress.trend === 'improving' ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : progress.progress.trend === 'declining' ? (
              <TrendingDown className="h-6 w-6 text-red-600" />
            ) : (
              <Activity className="h-6 w-6 text-muted" />
            )}
            <span className="text-lg font-semibold capitalize">{progress.progress.trend}</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      {progress.insights && (
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-medium text-blue-900">Insights & Recommendations</h3>
              {progress.insights.bestTimeOfDay && (
                <p className="text-sm text-blue-800">
                  • Your best performance is typically during <strong>{progress.insights.bestTimeOfDay}</strong>
                </p>
              )}
              {progress.insights.bestDayOfWeek && (
                <p className="text-sm text-blue-800">
                  • You're most consistent on <strong>{progress.insights.bestDayOfWeek}s</strong>
                </p>
              )}
              {progress.insights.recommendations?.map((rec, idx) => (
                <p key={idx} className="text-sm text-blue-800">• {rec}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressCharts;
