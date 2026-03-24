import { DollarSign, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react';

function Card({ title, value, subtitle, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-primary/10 text-primary',
    red: 'bg-danger/10 text-danger',
    green: 'bg-accent/10 text-accent',
    amber: 'bg-warning/10 text-warning',
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-text">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ data }) {
  if (!data) return null;

  const fmt = (n) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const spendingChange = data.last_month_spending > 0
    ? ((data.monthly_spending - data.last_month_spending) / data.last_month_spending * 100).toFixed(1)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="Balance"
        value={fmt(data.balance)}
        subtitle="Total across all time"
        icon={DollarSign}
        color="blue"
      />
      <Card
        title="Monthly Spending"
        value={fmt(data.monthly_spending)}
        subtitle={`${spendingChange > 0 ? '+' : ''}${spendingChange}% vs last month`}
        icon={TrendingDown}
        color="red"
      />
      <Card
        title="Monthly Income"
        value={fmt(data.monthly_income)}
        icon={TrendingUp}
        color="green"
      />
      <Card
        title="Savings Rate"
        value={`${data.savings_rate}%`}
        subtitle={data.savings_rate >= 20 ? 'On track!' : 'Below 20% target'}
        icon={PiggyBank}
        color={data.savings_rate >= 20 ? 'green' : 'amber'}
      />
    </div>
  );
}
