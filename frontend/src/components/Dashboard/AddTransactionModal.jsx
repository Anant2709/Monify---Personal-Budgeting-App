import { useState, useEffect } from 'react';
import { X, Plus, Pencil, DollarSign, Store, Tag, Calendar, FileText } from 'lucide-react';
import { addTransaction, updateTransaction } from '../../services/api';

const CATEGORIES = [
  'Groceries', 'Dining', 'Rent', 'Utilities', 'Subscriptions',
  'Entertainment', 'Transport', 'Shopping', 'Health', 'Salary', 'Side Income',
];

const initialForm = {
  merchant: '',
  amount: '',
  category: 'Groceries',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  type: 'expense',
};

export default function AddTransactionModal({ open, onClose, onAdded, transaction }) {
  const isEdit = !!transaction;
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (transaction) {
      setForm({
        merchant: transaction.merchant || '',
        amount: String(transaction.amount ?? ''),
        category: transaction.category || 'Groceries',
        date: transaction.date || new Date().toISOString().slice(0, 10),
        description: transaction.description || '',
        type: transaction.type || 'expense',
      });
    } else {
      setForm(initialForm);
    }
  }, [transaction, open]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.merchant.trim()) return setError('Merchant is required');
    if (!form.amount || parseFloat(form.amount) <= 0) return setError('Enter a valid amount');

    setSaving(true);
    try {
      const payload = {
        merchant: form.merchant.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        description: form.description.trim(),
        type: form.type,
      };
      if (isEdit) {
        await updateTransaction(transaction.id, payload);
      } else {
        await addTransaction(payload);
      }
      setForm(initialForm);
      onAdded();
      onClose();
    } catch (err) {
      setError('Failed to add transaction. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <h3 className="text-lg font-bold text-text">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 p-1 bg-surface-alt rounded-xl">
            {[['expense', 'Expense'], ['income', 'Income']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => update('type', val)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  form.type === val
                    ? val === 'expense'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-emerald-500 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Merchant */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Merchant</label>
            <div className="relative">
              <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={form.merchant}
                onChange={(e) => update('merchant', e.target.value)}
                placeholder="e.g. Whole Foods, Netflix"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Amount</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Category</label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1.5 block">Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description (optional)</label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
              <input
                type="text"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What was this for?"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (
              <>{isEdit ? <><Pencil className="w-4 h-4" /> Save Changes</> : <><Plus className="w-4 h-4" /> Add Transaction</>}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
