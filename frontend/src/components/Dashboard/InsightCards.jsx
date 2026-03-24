import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Loader2, RefreshCw } from 'lucide-react';

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

export default function InsightCards({ data, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm text-text-secondary">Generating AI insights...</span>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 flex flex-col items-center justify-center text-center">
        <Lightbulb className="w-12 h-12 text-primary/50 mb-3" />
        <h3 className="font-semibold text-text mb-1">AI-Powered Insights</h3>
        <p className="text-sm text-text-secondary mb-4 max-w-sm">
          Get personalized spending analysis powered by AI. Add transactions or click below to generate.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Load Insights
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" />
          AI-Powered Insights
        </h3>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        )}
      </div>
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
