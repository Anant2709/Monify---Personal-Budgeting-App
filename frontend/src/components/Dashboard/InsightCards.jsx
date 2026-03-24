import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';

const ICON_MAP = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert': AlertTriangle,
  'lightbulb': Lightbulb,
};

const TYPE_STYLES = {
  success: 'border-l-accent bg-accent/5',
  warning: 'border-l-warning bg-warning/5',
  info: 'border-l-primary bg-primary/5',
  tip: 'border-l-purple-500 bg-purple-50',
};

export default function InsightCards({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-text-secondary">Generating AI insights...</span>
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-text flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-warning" />
        AI-Powered Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((insight, i) => {
          const Icon = ICON_MAP[insight.icon] || Lightbulb;
          return (
            <div
              key={i}
              className={`rounded-xl border-l-4 p-4 ${TYPE_STYLES[insight.type] || TYPE_STYLES.info}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 shrink-0 text-text-secondary" />
                <div>
                  <p className="font-semibold text-sm text-text">{insight.title}</p>
                  <p className="text-sm text-text-secondary mt-1">{insight.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
