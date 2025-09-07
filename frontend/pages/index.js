import { useEffect, useState } from 'react';
import api from '../services/api';

const StatCard = ({ label, value }) => (
  <div className="flex-1 rounded-2xl bg-white shadow-sm p-6">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="mt-2 text-3xl font-semibold">{value}</div>
  </div>
);

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [stats, setStats] = useState({ items: 0, pending: 0, receipts: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setErr('');
      setLoading(true);
      try {
        // 병렬 호출
        const [invRes, ordRes, recRes] = await Promise.all([
          api.get('/inventory'),
          api.get('/order'),
          api.get('/receipt'),
        ]);

        const inv = Array.isArray(invRes.data) ? invRes.data : [];
        const orders = Array.isArray(ordRes.data) ? ordRes.data : [];
        const receipts = Array.isArray(recRes.data) ? recRes.data : [];

        // KPI 계산
        const items = inv.length;
        const pending = orders.filter((o) => o.status === 'pending' || o.status === 'partial').length;
        const receiptsCount = receipts.length;

        // 최근 입고 5건 (receivedAt -> createdAt 순으로 정렬)
        const recentReceipts = [...receipts]
          .sort((a, b) => {
            const ad = new Date(a.receivedAt || a.createdAt || 0).getTime();
            const bd = new Date(b.receivedAt || b.createdAt || 0).getTime();
            return bd - ad;
          })
          .slice(0, 5);

        if (mounted) {
          setStats({ items, pending, receipts: receiptsCount });
          setRecent(recentReceipts);
          setLoading(false);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        if (mounted) {
          setErr(e?.response?.data?.error || 'Failed to load dashboard.');
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6 space-y-6 bg-brand-bg min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Stock Items" value={loading ? '—' : stats.items} />
        <StatCard label="Pending Orders" value={loading ? '—' : stats.pending} />
        <StatCard label="Total Receipts" value={loading ? '—' : stats.receipts} />
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Recent Receiving</h2>
          {err ? <span className="text-sm text-red-600">{err}</span> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-gray-500">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Items</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 text-gray-400" colSpan={3}>Loading…</td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td className="py-3 text-gray-400" colSpan={3}>No recent receipts.</td>
                </tr>
              ) : (
                recent.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2">
                      {new Date(r.receivedAt || r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      {Array.isArray(r.items) && r.items.length > 0
                        ? r.items.map((it, idx) => (
                            <span key={`${r._id}-${idx}`} className="block">
                              {it.name} (+{it.quantity} {it.unit})
                            </span>
                          ))
                        : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="py-2 text-gray-600">{r.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}