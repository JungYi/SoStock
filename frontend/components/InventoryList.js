import { useEffect, useMemo, useState } from 'react';
import useDebounce from '../hooks/useDebounce';
import api from '../services/api';

const SortButton = ({ label, field, sortBy, sortDir, onChange }) => {
  const active = sortBy === field;
  const icon = active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅';
  return (
    <button
      type="button"
      className={`text-left w-full flex items-center gap-1 ${active ? 'font-semibold' : ''}`}
      onClick={() => onChange(field)}
      title={`Sort by ${label}`}
    >
      <span>{label}</span>
      <span className="text-xs">{icon}</span>
    </button>
  );
};

export default function InventoryList({ onEdit, onDelete }) {
  // raw data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // search/sort states
  const [q, setQ] = useState('');
  const qDebounced = useDebounce(q, 300);

  // 'name' | 'category' | 'brand' | 'quantity' | 'updatedAt'
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  // 최초 로드 (부모가 key로 리마운트하므로 의존성 X)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setErr('');
      try {
        const res = await api.get('/inventory');
        if (mounted) setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        if (mounted) setErr('Failed to load inventory.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      // 문자열은 asc, 날짜/숫자는 desc를 기본으로
      if (['name', 'category', 'brand'].includes(field)) setSortDir('asc');
      else setSortDir('desc');
    }
  };

  // filter + sort (디바운스 적용)
  const viewRows = useMemo(() => {
    const keyword = qDebounced.trim().toLowerCase();

    const filtered = keyword
      ? items.filter((it) => {
          const name = String(it.name || '').toLowerCase();
          const cat = String(it.category || '').toLowerCase();
          const brand = String(it.brand || '').toLowerCase();
          return (
            name.includes(keyword) ||
            cat.includes(keyword) ||
            brand.includes(keyword)
          );
        })
      : items;

    const dir = sortDir === 'asc' ? 1 : -1;

    const sorted = [...filtered].sort((a, b) => {
      if (['name', 'category', 'brand'].includes(sortBy)) {
        return String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')) * dir;
      }
      if (sortBy === 'quantity') {
        return ((a.quantity || 0) - (b.quantity || 0)) * dir;
      }
      // updatedAt (default)
      const ad = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bd = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return (ad - bd) * dir;
    });

    return sorted;
  }, [items, qDebounced, sortBy, sortDir]);

  return (
    <div className="card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <h2 className="text-xl font-semibold">Inventory</h2>
        <div className="flex items-center gap-2">
          <input
            type="search"
            className="border rounded px-3 py-2 w-72"
            placeholder="Search name / category / brand…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${viewRows.length} / ${items.length}`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">
                <SortButton
                  label="Name"
                  field="name"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border">
                <SortButton
                  label="Category"
                  field="category"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border">
                <SortButton
                  label="Brand"
                  field="brand"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border">
                <SortButton
                  label="Qty"
                  field="quantity"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border">Unit</th>
              <th className="p-2 border">
                <SortButton
                  label="Last Updated"
                  field="updatedAt"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-4 text-gray-500" colSpan={7}>Loading…</td>
              </tr>
            ) : viewRows.length === 0 ? (
              <tr>
                <td className="p-4 text-gray-500" colSpan={7}>No items found.</td>
              </tr>
            ) : (
              viewRows.map((it) => (
                <tr key={it._id}>
                  <td className="p-2 border">{it.name}</td>
                  <td className="p-2 border">{it.category || '-'}</td>
                  <td className="p-2 border">{it.brand || '-'}</td>
                  <td className="p-2 border">{Number(it.quantity)}</td>
                  <td className="p-2 border">{it.unit}</td>
                  <td className="p-2 border">
                    {new Date(it.updatedAt || it.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 border">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-2 py-1 rounded bg-gray-800 text-white"
                        onClick={() => onEdit?.(it)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded bg-red-600 text-white"
                        onClick={() => onDelete?.(it._id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
    </div>
  );
}