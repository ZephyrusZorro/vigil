import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { capitalize } from '@/utils/format';

interface RiskChartProps {
  data: { level: string; count: number }[];
}

export const RiskChart: React.FC<RiskChartProps> = ({ data }) => {
  const getBarColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const chartData = data.map(d => ({
    ...d,
    displayName: capitalize(d.level),
  }));

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100">Risk Profile Analysis</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Prioritized risk exposure breakdown</p>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="displayName"
              stroke="#71717A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
            />
            <YAxis
              stroke="#71717A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg shadow-xl text-xs">
                      <span className="font-semibold text-zinc-200">{item.displayName} Risk</span>
                      <p className="text-zinc-400 mt-1 font-mono">
                        {item.count} items tracked
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={getBarColor(entry.level)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60 text-center">
        {chartData.map(item => (
          <div key={item.level} className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60">
            <span className="text-[10px] text-zinc-500 font-medium block truncate">
              {item.displayName}
            </span>
            <span className="font-bold text-sm text-zinc-200 mt-0.5 block font-mono">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
