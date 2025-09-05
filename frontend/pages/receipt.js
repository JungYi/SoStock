import { useEffect, useMemo, useState } from 'react';
import ReceiptForm from '../components/ReceiptForm';
import api from '../services/api';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [sortBy, setSortBy] = useState('receivedAt'); // 'receivedAt' | 'createdAt'
  const [sortDir, setSortDir] = useState('desc'); // 'desc' | 'asc'
  const [loading, setLoading] = useState(false);

  // 🔎 Notes search
  const [search, setSearch] = useState('');

  const refetch = () => setRefresh((n) => n + 1);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/receipt');
        if (mounted) setReceipts(res.data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch receipts:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const filteredAndSorted = useMemo(() => {
    const list = Array.isArray(receipts) ? [...receipts] : [];
    const q = search.trim().toLowerCase();

    const filtered = q
      ? list.filter((r) => String(r.notes || '').toLowerCase().includes(q))
      : list;

    return filtered.sort((a, b) => {
      const ak = sortBy === 'receivedAt'
        ? (a.receivedAt || a.createdAt || 0)
        : (a.createdAt || 0);
      const bk = sortBy === 'receivedAt'
        ? (b.receivedAt || b.createdAt || 0)
        : (b.createdAt || 0);

      const diff = new Date(bk).getTime() - new Date(ak).getTime();
      return sortDir === 'desc' ? diff : -diff;
    });
  }, [receipts, search, sortBy, sortDir]);

  return (
    <div className="p-6 space-y-6">
      {/* Create Receipt (with optional Order prefill) */}
      <ReceiptForm onCreated={refetch} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Receipts</h1>

        {/* Toolbar: search + sort */}
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="border rounded px-3 py-2 w-64"
            placeholder="Search by notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-600">Sort by</span>
            <button
              type="button"
              className={`px-3 py-1 rounded border ${sortBy === 'receivedAt' ? 'bg-black text-white' : ''}`}
              onClick={() => setSortBy('receivedAt')}
              title="Sort by received date"
            >
              Received Date
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded border ${sortBy === 'createdAt' ? 'bg-black text-white' : ''}`}
              onClick={() => setSortBy('createdAt')}
              title="Sort by created date"
            >
              Created Date
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded border"
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              title="Toggle sort direction"
            >
              {sortDir === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Received At</th>
              <th className="p-2 border">Items</th>
              <th className="p-2 border">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-center" colSpan={3}>
                  Loading…
                </td>
              </tr>
            ) : filteredAndSorted.length === 0 ? (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={3}>
                  No receipts found.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((r) => (
                <tr key={r._id}>
                  <td className="p-2 border">
                    {r.receivedAt
                      ? new Date(r.receivedAt).toLocaleDateString()
                      : (r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString()
                          : '-')}
                  </td>
                  <td className="p-2 border">
                    {Array.isArray(r.items) && r.items.length > 0 ? (
                      r.items.map((i, idx) => (
                        <span key={`${r._id}-${idx}`} className="block">
                          {i.name} (+{Number(i.quantity)} {i.unit})
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No items</span>
                    )}
                  </td>
                  <td className="p-2 border">{r.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}