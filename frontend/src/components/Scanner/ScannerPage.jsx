import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  ScanLine,
  Upload,
  Loader2,
  CheckCircle2,
  ReceiptText,
  Plus,
} from 'lucide-react';
import { scanReceipt, confirmReceipt } from '../../services/api';

const CATEGORIES = [
  'Groceries', 'Dining', 'Rent', 'Utilities', 'Subscriptions',
  'Entertainment', 'Transport', 'Shopping', 'Health',
];

export default function ScannerPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [editable, setEditable] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (result && !result.error) {
      setEditable({
        merchant: result.merchant || '',
        date: result.date || new Date().toISOString().slice(0, 10),
        total: typeof result.total === 'number' ? result.total : parseFloat(result.total) || 0,
        category: result.suggested_category || 'Groceries',
        items: (result.items || []).map((i) => ({
          name: i.name || '',
          price: typeof i.price === 'number' ? i.price : parseFloat(i.price) || 0,
          category: result.suggested_category || 'Groceries',
        })),
      });
    } else {
      setEditable(null);
    }
  }, [result]);

  const onDrop = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setResult(null);
    setEditable(null);
    setConfirmed(null);
    setScanning(true);

    try {
      const data = await scanReceipt(file);
      if (data.error) {
        setResult({ error: data.error });
      } else {
        setResult(data);
      }
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setScanning(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  });

  async function handleConfirm() {
    if (!editable) return;
    try {
      const resp = await confirmReceipt({
        merchant: editable.merchant.trim(),
        total: editable.items?.length ? editable.items.reduce((s, i) => s + i.price, 0) : editable.total,
        category: editable.category,
        date: editable.date,
        items: editable.items?.length ? editable.items.map((i) => ({
          name: i.name,
          price: i.price,
          category: i.category ?? editable.category,
        })) : [],
      });
      setConfirmed(resp);
    } catch (e) {
      console.error('Failed to confirm receipt:', e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-primary" />
          Receipt Scanner
        </h2>
        <p className="text-text-secondary mt-1">
          Upload a receipt photo and AI will extract the details automatically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-surface-hover'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="font-medium text-text">
              {isDragActive ? 'Drop your receipt here' : 'Drag & drop a receipt image'}
            </p>
            <p className="text-sm text-text-muted mt-1">or click to browse files</p>
            <p className="text-xs text-text-muted mt-4">Supports PNG, JPG, WEBP</p>
          </div>

          {preview && (
            <div className="mt-4 rounded-2xl border border-border overflow-hidden">
              <img src={preview} alt="Receipt preview" className="w-full max-h-80 object-contain bg-surface-alt" />
            </div>
          )}
        </div>

        <div>
          {scanning && (
            <div className="bg-white rounded-2xl border border-border p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="font-medium text-text">Scanning receipt...</p>
              <p className="text-sm text-text-muted mt-1">AI is extracting transaction details</p>
            </div>
          )}

          {result && !result.error && editable && (
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-2 mb-1">
                  <ReceiptText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text">Extracted Details</h3>
                </div>
                <p className="text-xs text-text-muted mt-1">Edit any field before adding to your transactions</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted font-medium uppercase tracking-wide">Merchant</label>
                    <input
                      type="text"
                      value={editable.merchant}
                      onChange={(e) => setEditable((prev) => ({ ...prev, merchant: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium uppercase tracking-wide">Date</label>
                    <input
                      type="date"
                      value={editable.date}
                      onChange={(e) => setEditable((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted font-medium uppercase tracking-wide">Total</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editable.total}
                      onChange={(e) => setEditable((prev) => ({ ...prev, total: parseFloat(e.target.value) || 0 }))}
                      className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  {(!editable.items?.length) && (
                    <div>
                      <label className="text-xs text-text-muted font-medium uppercase tracking-wide">Category</label>
                      <select
                        value={editable.category}
                        onChange={(e) => setEditable((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {editable.items?.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted font-medium uppercase tracking-wide mb-2">Line Items</p>
                    <div className="space-y-2">
                      {editable.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center py-1.5 border-b border-border last:border-0">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const next = [...editable.items];
                              next[i] = { ...next[i], name: e.target.value };
                              setEditable((prev) => ({ ...prev, items: next }));
                            }}
                            placeholder="Item name"
                            className="flex-1 min-w-0 px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => {
                              const next = [...editable.items];
                              next[i] = { ...next[i], price: parseFloat(e.target.value) || 0 };
                              setEditable((prev) => ({ ...prev, items: next }));
                            }}
                            className="w-20 px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <select
                            value={item.category ?? editable.category}
                            onChange={(e) => {
                              const next = [...editable.items];
                              next[i] = { ...next[i], category: e.target.value };
                              setEditable((prev) => ({ ...prev, items: next }));
                            }}
                            className="w-28 shrink-0 px-2 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border">
                {confirmed ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-accent">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium text-sm">
                        {confirmed.transactions_created} transaction{confirmed.transactions_created !== 1 ? 's' : ''} added!
                      </span>
                    </div>
                    <div className="bg-surface-alt rounded-xl p-3 space-y-1">
                      {confirmed.transactions.map((tx) => (
                        <div key={tx.id} className="flex justify-between text-xs text-text-secondary">
                          <span>{tx.description}</span>
                          <span className="font-medium">${tx.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleConfirm}
                    className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add {editable.items?.length || 1} Transaction{(editable.items?.length || 1) !== 1 ? 's' : ''} 
                  </button>
                )}
              </div>
            </div>
          )}

          {result?.error && (
            <div className="bg-white rounded-2xl border border-border border-l-4 border-l-danger p-6">
              <p className="font-semibold text-danger mb-1">Scan Failed</p>
              <p className="text-sm text-text-secondary">{result.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
