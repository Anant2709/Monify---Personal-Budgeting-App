import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: API_BASE });

export async function fetchSummary() {
  const { data } = await api.get('/transactions/summary');
  return data;
}

export async function fetchTransactions(days = 90) {
  const { data } = await api.get(`/transactions?days=${days}`);
  return data;
}

export async function fetchByCategory(days = 30, month = null) {
  const params = month ? `month=${month}` : `days=${days}`;
  const { data } = await api.get(`/transactions/by-category?${params}`);
  return data;
}

export async function fetchMonthlyTrend() {
  const { data } = await api.get('/transactions/monthly-trend');
  return data;
}

export async function fetchInsights() {
  const { data } = await api.get('/insights');
  return data;
}

export async function fetchAlerts() {
  const { data } = await api.get('/alerts');
  return data;
}

export async function streamChat(message, history) {
  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  return response.body.getReader();
}

export async function scanReceipt(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/scanner/scan', form);
  return data;
}

export async function confirmReceipt({ merchant, total, category, date, items }) {
  const { data } = await api.post('/scanner/confirm', {
    merchant, total, category, date, items,
  });
  return data;
}

export async function addTransaction({ merchant, amount, category, description, type, date }) {
  const params = new URLSearchParams({ merchant, amount, category });
  if (description) params.append('description', description);
  if (type) params.append('tx_type', type);
  if (date) params.append('tx_date', date);
  const { data } = await api.post(`/transactions?${params}`);
  return data;
}

export async function updateTransaction(id, { merchant, amount, category, description, type, date }) {
  const params = new URLSearchParams({ merchant, amount: String(amount), category });
  if (description) params.append('description', description);
  if (type) params.append('tx_type', type);
  if (date) params.append('tx_date', date);
  const { data } = await api.put(`/transactions/${id}?${params}`);
  return data;
}

export async function deleteTransaction(id) {
  const { data } = await api.delete(`/transactions/${id}`);
  return data;
}
