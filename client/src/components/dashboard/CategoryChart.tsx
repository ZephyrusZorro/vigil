import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CategoryChartProps {
  data: { name: string; count: number; color: string }[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-500">
        No category data available
      </div>
    );
  }

  const chartData = data.filter(d => d.count > 0);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Category Distribution</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Asset & compliance allocation</p>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              stroke="transparent"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-zinc-200">{item.name}</span>
                      </div>
                      <p className="text-zinc-400 mt-1 font-mono">
                        {item.count} items ({Math.round((item.count / chartData.reduce((acc, c) => acc + c.count, 0)) * 100)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/60 max-h-24 overflow-y-auto">
        {chartData.map(item => (
          <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate max-w-[120px]">{item.name}</span>
            <span className="font-mono text-zinc-500">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
