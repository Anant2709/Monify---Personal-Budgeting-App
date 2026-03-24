import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { fetchAlerts } from '../../services/api';

const SEVERITY_STYLES = {
  high: {
    border: 'border-l-danger',
    bg: 'bg-danger/5',
    icon: AlertTriangle,
    iconColor: 'text-danger',
    badge: 'bg-danger/10 text-danger',
  },
  medium: {
    border: 'border-l-warning',
    bg: 'bg-warning/5',
    icon: AlertCircle,
    iconColor: 'text-warning',
    badge: 'bg-warning/10 text-warning',
  },
  low: {
    border: 'border-l-primary',
    bg: 'bg-primary/5',
    icon: Info,
    iconColor: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text flex items-center gap-2">
            <Bell className="w-6 h-6 text-warning" />
            Smart Budget Alerts
          </h2>
          <p className="text-text-secondary mt-1">
            AI-detected spending anomalies and actionable recommendations
          </p>
        </div>
        <button
          onClick={loadAlerts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : alerts === null ? 'Load Alerts' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-12 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-text-secondary">Analyzing your spending patterns...</span>
        </div>
      ) : alerts === null ? (
        <div className="bg-white rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center">
          <Bell className="w-12 h-12 text-primary/50 mb-3" />
          <h3 className="font-semibold text-text mb-1">Smart Budget Alerts</h3>
          <p className="text-sm text-text-secondary mb-4 max-w-sm">
            AI-detected spending anomalies and recommendations. Click above to analyze your data.
          </p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-semibold text-lg text-text">All Clear!</h3>
          <p className="text-text-secondary text-sm mt-1">
            No spending anomalies detected. Your budget looks healthy.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...alerts].sort((a, b) => {
            const rank = { high: 0, medium: 1, low: 2 };
            return (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3);
          }).map((alert, i) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low;
            const Icon = style.icon;
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border border-border border-l-4 ${style.border} p-5 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${style.bg}`}>
                    <Icon className={`w-5 h-5 ${style.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-text">{alert.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{alert.message}</p>
                    {alert.suggestion && (
                      <div className="mt-3 flex items-start gap-2 bg-surface-alt rounded-xl p-3">
                        <span className="text-xs font-semibold text-primary shrink-0 mt-0.5">TIP</span>
                        <p className="text-xs text-text-secondary">{alert.suggestion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
