import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import ReceiptForm from '../components/ReceiptForm';
import api from '../services/api';

const SortButton = ({ label, field, sortBy, sortDir, onField, onDir }) => {
  const active = sortBy === field;
  const icon = active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅';
  return (
    <button
      type="button"
      className={`btn ${active ? 'btn-primary' : ''}`}
      onClick={() => {
        if (active) onDir((d) => (d === 'desc' ? 'asc' : 'desc'));
        else onField(field);
      }}
      title={`Sort by ${label}`}
    >
      {label} <span className="text-xs">{icon}</span>
    </button>
  );
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);

  // Search & Sort
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('receivedAt'); // 'receivedAt' | 'createdAt'
  const [sortDir, setSortDir] = useState('desc'); // 'desc' | 'asc'

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
        toast.error('Failed to load receipts.');
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
    <div className="p-6 space-y-6 bg-brand-bg min-h-screen">
      {/* Create Receipt */}
      <div className="card">
        <ReceiptForm onCreated={refetch} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Receipts</h1>

        <div className="flex items-center gap-2">
          <input
            type="search"
            className="input w-64"
            placeholder="Search by notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-sm text-gray-500">
            {filteredAndSorted.length} / {receipts.length}
          </span>
          <div className="flex items-center gap-2">
            <SortButton
              label="Received Date"
              field="receivedAt"
              sortBy={sortBy}
              sortDir={sortDir}
              onField={setSortBy}
              onDir={setSortDir}
            />
            <SortButton
              label="Created Date"
              field="createdAt"
              sortBy={sortBy}
              sortDir={sortDir}
              onField={setSortBy}
              onDir={setSortDir}
            />
            <button
              type="button"
              className="btn btn-muted"
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              title="Toggle sort direction"
            >
              {sortDir === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto card">
        <table className="table">
          <thead>
            <tr>
              <th>Received At</th>
              <th>Items</th>
              <th>Notes</th>
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
                  <td>
                    {r.receivedAt
                      ? new Date(r.receivedAt).toLocaleDateString()
                      : (r.createdAt
                          ? new Date(r.createdAt).toLocaleDateString()
                          : '-')}
                  </td>
                  <td>
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
                  <td>{r.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}