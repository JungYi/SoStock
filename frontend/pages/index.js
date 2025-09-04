import { useEffect, useState } from 'react';
import api from '../services/api';

const StatCard = ({ label, value }) => (
  <div className="flex-1 rounded-2xl bg-white shadow-sm p-6">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="mt-2 text-3xl font-semibold">{value}</div>
  </div>
);

export default function HomePage() {
  const [stats, setStats] = useState({ items: 0, pending: 0, receipts: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [inv, orders, rec] = await Promise.all([
          api.get('/inventory'),
          api.get('/order'),
          api.get('/receipt'),
        ]);

        const items = Array.isArray(inv.data) ? inv.data.length : 0;
        const pending = Array.isArray(orders.data)
          ? orders.data.filter((o) => o.status === 'pending' || o.status === 'partial').length
          : 0;
        const receipts = Array.isArray(rec.data) ? rec.data.length : 0;

        const recentReceipts = Array.isArray(rec.data)
          ? [...rec.data]
              .sort((a, b) => new Date(b.receivedAt || b.createdAt) - new Date(a.receivedAt || a.createdAt))
              .slice(0, 5)
          : [];

        if (mounted) {
          setStats({ items, pending, receipts });
          setRecent(recentReceipts);
          setLoading(false);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Stock Items" value={loading ? '—' : stats.items} />
        <StatCard label="Pending Orders" value={loading ? '—' : stats.pending} />
        <StatCard label="Total Receipts" value={loading ? '—' : stats.receipts} />
      </div>

      <div className="rounded-2xl bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Recent Receiving</h2>
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
                <tr><td className="py-3 text-gray-400" colSpan={3}>Loading…</td></tr>
              ) : recent.length === 0 ? (
                <tr><td className="py-3 text-gray-400" colSpan={3}>No recent receipts.</td></tr>
              ) : (
                recent.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2">
                      {new Date(r.receivedAt || r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      {r.items?.map((it, idx) => (
                        <span key={`${r._id}-${idx}`} className="block">
                          {it.name} (+{it.quantity} {it.unit})
                        </span>
                      ))}
                    </td>
                    <td className="py-2 text-gray-600">{r.notes || '-'}</td>
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