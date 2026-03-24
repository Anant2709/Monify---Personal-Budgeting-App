import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white border border-border rounded-xl px-4 py-2 shadow-lg">
      <p className="font-semibold text-sm">{d.name}</p>
      <p className="text-sm text-text-secondary">
        ${d.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function CategoryChart({ data, months, selectedMonth, onMonthChange }) {
  if (!data?.length) return null;

  const total = data.reduce((s, d) => s + d.total, 0);
  const chartData = data.map((d) => ({ name: d.category, value: d.total }));

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text">Spending by Category</h3>
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-surface-alt text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Last 30 days</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-6">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2 max-h-48 overflow-y-auto">
          {[...data]
            .sort((a, b) => b.total - a.total)
            .map((d, i) => (
              <div key={d.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-text-secondary">{d.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    ${d.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-text-muted text-xs w-10 text-right">
                    {((d.total / total) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
      <p className="text-xs text-text-muted mt-3 text-right">
        Total: ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
