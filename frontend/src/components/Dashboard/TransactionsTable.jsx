import { useState, useMemo } from 'react';
import { ArrowUpDown, Search, X, Calendar, Filter } from 'lucide-react';

const CATEGORY_COLORS = {
  Groceries: 'bg-green-100 text-green-700',
  Dining: 'bg-orange-100 text-orange-700',
  Rent: 'bg-blue-100 text-blue-700',
  Utilities: 'bg-cyan-100 text-cyan-700',
  Subscriptions: 'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Transport: 'bg-yellow-100 text-yellow-700',
  Shopping: 'bg-indigo-100 text-indigo-700',
  Health: 'bg-red-100 text-red-700',
  Salary: 'bg-emerald-100 text-emerald-700',
  'Side Income': 'bg-teal-100 text-teal-700',
};

export default function TransactionsTable({ data }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const perPage = 10;

  const categories = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((t) => t.category))].sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = data.filter((t) => {
      if (search && !t.merchant.toLowerCase().includes(search.toLowerCase()) &&
          !t.category.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedCategory && t.category !== selectedCategory) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = new Date(a.date) - new Date(b.date);
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else cmp = a[sortKey]?.localeCompare?.(b[sortKey]) || 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [data, search, sortKey, sortDir, selectedCategory, dateFrom, dateTo]);

  const filteredTotal = useMemo(() => {
    return filtered.reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
  }, [filtered]);

  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);
  const hasFilters = selectedCategory || dateFrom || dateTo;

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }

  function clearFilters() {
    setSelectedCategory('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(0);
  }

  return (
    <div className="bg-white rounded-2xl border border-border">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text">Recent Transactions</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:text-primary-dark flex items-center gap-1 font-medium"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search merchant..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
              className={`pl-9 pr-8 py-2 text-sm border rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                selectedCategory ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border bg-surface-alt text-text-secondary'
              }`}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className={`pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  dateFrom ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border bg-surface-alt text-text-secondary'
                }`}
              />
            </div>
            <span className="text-text-muted text-xs">to</span>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className={`pl-9 pr-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  dateTo ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border bg-surface-alt text-text-secondary'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-border bg-surface-alt">
              {[
                ['date', 'Date'],
                ['merchant', 'Merchant'],
                ['category', 'Category'],
                ['amount', 'Amount'],
              ].map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="px-6 py-3 text-left font-medium text-text-secondary cursor-pointer hover:text-text select-none"
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-text-muted text-sm">
                  No transactions match your filters.
                </td>
              </tr>
            ) : (
              pageData.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-surface-alt transition-colors">
                  <td className="px-6 py-3 text-text-secondary">{t.date}</td>
                  <td className="px-6 py-3 font-medium text-text">{t.merchant}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => { setSelectedCategory(selectedCategory === t.category ? '' : t.category); setPage(0); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        CATEGORY_COLORS[t.category] || 'bg-gray-100 text-gray-700'
                      } ${selectedCategory === t.category ? 'ring-2 ring-offset-1 ring-primary/40' : 'hover:opacity-80'}`}
                    >
                      {t.category}
                    </button>
                  </td>
                  <td className={`px-6 py-3 font-semibold ${t.type === 'income' ? 'text-accent' : 'text-danger'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-xs text-text-muted">
            {filtered.length > 0
              ? `Showing ${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)} of ${filtered.length}`
              : '0 results'}
          </p>
          {hasFilters && filtered.length > 0 && (
            <p className={`text-xs font-semibold ${filteredTotal >= 0 ? 'text-accent' : 'text-danger'}`}>
              Net: {filteredTotal >= 0 ? '+' : ''}${filteredTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
