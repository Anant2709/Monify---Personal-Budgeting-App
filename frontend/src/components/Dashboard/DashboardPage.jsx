import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import SummaryCards from './SummaryCards';
import CategoryChart from './CategoryChart';
import MonthlyTrend from './MonthlyTrend';
import TransactionsTable from './TransactionsTable';
import InsightCards from './InsightCards';
import AddTransactionModal from './AddTransactionModal';
import {
  fetchSummary,
  fetchTransactions,
  fetchByCategory,
  fetchMonthlyTrend,
  fetchInsights,
} from '../../services/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trend, setTrend] = useState([]);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [s, t, c, m] = await Promise.all([
        fetchSummary(),
        fetchTransactions(365),
        fetchByCategory(),
        fetchMonthlyTrend(),
      ]);
      setSummary(s);
      setTransactions(t);
      setCategories(c);
      setTrend(m);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const data = await fetchInsights();
      setInsights(data);
    } catch (e) {
      console.error('Failed to load insights:', e);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const handleDataAdded = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  const handleMonthChange = useCallback(async (month) => {
    setSelectedMonth(month);
    try {
      const data = await fetchByCategory(30, month || null);
      setCategories(data);
    } catch (e) {
      console.error('Failed to load category data:', e);
    }
  }, []);

  const availableMonths = trend.map((t) => t.month);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Hey there! Here's your overview</h2>
          <p className="text-text-secondary mt-1">Your spending, savings, and insights — all in one place</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      <SummaryCards data={summary} />

      <InsightCards data={insights} loading={insightsLoading} onRefresh={loadInsights} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart
          data={categories}
          months={availableMonths}
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />
        <MonthlyTrend data={trend} />
      </div>

      <TransactionsTable data={transactions} onRefresh={loadAll} />

      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleDataAdded}
      />
    </div>
  );
}
