/**
 * 📊 CHART RENDERER - Main Chart Rendering Component
 * Extracted from StatsChart.jsx for better performance and maintainability
 * Features: Multiple chart types, Responsive rendering, Theme support
 * @version 2.0.0
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, ComposedChart, ReferenceLine, Brush
} from 'recharts';

// ✅ Import Zustand stores
import { useTheme } from '../../../../stores';

import { createCustomTooltip } from './ChartTooltip';
import { cn } from '../../../../utils/helpers';

/**
 * 📈 Line Chart Renderer
 */
const LineChartRenderer = ({ 
  data, 
  selectedMetrics, 
  colors, 
  formatCurrency,
  showGrid = true,
  showBrush = false 
}) => {
  const CustomTooltip = createCustomTooltip({ formatCurrency, chartType: 'line' });

  return (
    <LineChart data={data}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
      <XAxis 
        dataKey="date" 
        axisLine={false}
        tickLine={false}
        fontSize={12}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        fontSize={12}
        tickFormatter={formatCurrency}
      />
      <Tooltip content={CustomTooltip} />
      <Legend />
      
      {selectedMetrics.map((metric) => (
        <Line
          key={metric}
          type="monotone"
          dataKey={metric}
          stroke={colors[metric]}
          strokeWidth={2}
          dot={{ fill: colors[metric], strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, strokeWidth: 0 }}
          connectNulls={false}
        />
      ))}
      
      {showBrush && <Brush dataKey="date" height={30} />}
    </LineChart>
  );
};

/**
 * 📊 Bar Chart Renderer
 */
const BarChartRenderer = ({ 
  data, 
  selectedMetrics, 
  colors, 
  formatCurrency,
  showGrid = true 
}) => {
  const CustomTooltip = createCustomTooltip({ formatCurrency, chartType: 'bar' });

  return (
    <BarChart data={data}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
      <XAxis 
        dataKey="date" 
        axisLine={false}
        tickLine={false}
        fontSize={12}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        fontSize={12}
        tickFormatter={formatCurrency}
      />
      <Tooltip content={CustomTooltip} />
      <Legend />
      
      {selectedMetrics.map((metric) => (
        <Bar
          key={metric}
          dataKey={metric}
          fill={colors[metric]}
          radius={[2, 2, 0, 0]}
        />
      ))}
    </BarChart>
  );
};

/**
 * 📈 Area Chart Renderer
 */
const AreaChartRenderer = ({ 
  data, 
  selectedMetrics, 
  colors, 
  formatCurrency,
  showGrid = true 
}) => {
  const CustomTooltip = createCustomTooltip({ formatCurrency, chartType: 'area' });

  return (
    <AreaChart data={data}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
      <XAxis 
        dataKey="date" 
        axisLine={false}
        tickLine={false}
        fontSize={12}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        fontSize={12}
        tickFormatter={formatCurrency}
      />
      <Tooltip content={CustomTooltip} />
      <Legend />
      
      {selectedMetrics.map((metric, index) => (
        <Area
          key={metric}
          type="monotone"
          dataKey={metric}
          stackId={1}
          stroke={colors[metric]}
          fill={colors[metric]}
          fillOpacity={0.6}
        />
      ))}
    </AreaChart>
  );
};

/**
 * 🥧 Pie Chart Renderer
 */
const PieChartRenderer = ({ 
  data, 
  selectedMetrics, 
  colors, 
  formatCurrency 
}) => {
  const CustomTooltip = createCustomTooltip({ formatCurrency, chartType: 'pie', simple: true });

  // Transform data for pie chart
  const pieData = useMemo(() => {
    if (!data.length) return [];
    
    const latestData = data[data.length - 1];
    return selectedMetrics.map(metric => ({
      name: metric,
      value: latestData[metric] || 0,
      fill: colors[metric]
    }));
  }, [data, selectedMetrics, colors]);

  return (
    <PieChart>
      <Pie
        data={pieData}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        outerRadius={120}
        fill="#8884d8"
        dataKey="value"
      >
        {pieData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.fill} />
        ))}
      </Pie>
      <Tooltip content={CustomTooltip} />
      <Legend />
    </PieChart>
  );
};

/**
 * 📊 Composed Chart Renderer (Line + Bar)
 */
const ComposedChartRenderer = ({ 
  data, 
  selectedMetrics, 
  colors, 
  formatCurrency,
  showGrid = true 
}) => {
  const CustomTooltip = createCustomTooltip({ formatCurrency, chartType: 'composed' });

  // Split metrics into line and bar
  const lineMetrics = selectedMetrics.filter(metric => metric === 'net');
  const barMetrics = selectedMetrics.filter(metric => metric !== 'net');

  return (
    <ComposedChart data={data}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
      <XAxis 
        dataKey="date" 
        axisLine={false}
        tickLine={false}
        fontSize={12}
      />
      <YAxis 
        axisLine={false}
        tickLine={false}
        fontSize={12}
        tickFormatter={formatCurrency}
      />
      <Tooltip content={CustomTooltip} />
      <Legend />
      
      {barMetrics.map((metric) => (
        <Bar
          key={metric}
          dataKey={metric}
          fill={colors[metric]}
          radius={[2, 2, 0, 0]}
        />
      ))}
      
      {lineMetrics.map((metric) => (
        <Line
          key={metric}
          type="monotone"
          dataKey={metric}
          stroke={colors[metric]}
          strokeWidth={3}
          dot={{ fill: colors[metric], strokeWidth: 2, r: 5 }}
        />
      ))}
    </ComposedChart>
  );
};

/**
 * 📊 Main Chart Renderer
 */
const ChartRenderer = ({
  chartType,
  data,
  selectedMetrics,
  colors,
  formatCurrency,
  showGrid = true,
  showBrush = false,
  height = "100%",
  className = ''
}) => {
  const { isDark } = useTheme();

  // Chart renderer mapping
  const renderChart = useMemo(() => {
    const commonProps = {
      data,
      selectedMetrics,
      colors,
      formatCurrency,
      showGrid
    };

    switch (chartType) {
      case 'line':
        return <LineChartRenderer {...commonProps} showBrush={showBrush} />;
      case 'bar':
        return <BarChartRenderer {...commonProps} />;
      case 'area':
        return <AreaChartRenderer {...commonProps} />;
      case 'pie':
        return <PieChartRenderer {...commonProps} />;
      case 'composed':
        return <ComposedChartRenderer {...commonProps} />;
      default:
        return <LineChartRenderer {...commonProps} />;
    }
  }, [chartType, data, selectedMetrics, colors, formatCurrency, showGrid, showBrush]);

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartRenderer;
export { 
  LineChartRenderer, 
  BarChartRenderer, 
  AreaChartRenderer, 
  PieChartRenderer, 
  ComposedChartRenderer 
}; 