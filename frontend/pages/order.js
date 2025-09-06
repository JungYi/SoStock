import OrderForm from '../components/OrderForm';
import { useEffect, useMemo, useState } from 'react';
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

export default function OrdersPage() {
  // State
  const [orders, setOrders] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [loadingId, setLoadingId] = useState(null);

  // Search & Sort
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'supplier' | 'status'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  const refetch = () => setRefresh((n) => n + 1);

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      try {
        const res = await api.get('/order');
        if (mounted) setOrders(res.data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to fetch orders:', err);
      }
    };
    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const handleCancel = async (orderId) => {
    if (!orderId) return;
    // eslint-disable-next-line no-restricted-globals, no-alert
    if (!confirm('Cancel this order?')) return;
    try {
      setLoadingId(orderId);
      await api.patch(`/order/${orderId}/status`, { status: 'canceled' });
      refetch();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Failed to cancel order.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleAutoReceive = async (orderId) => {
    if (!orderId) return;
    try {
      setLoadingId(orderId);
      await api.post(`/order/${orderId}/receipt`, {});
      refetch();
    } catch (err) {
      const status = err?.response?.status;
      // eslint-disable-next-line no-alert
      if (status === 409) alert('Already fully received.');
      else alert('Failed to auto receive.');
    } finally {
      setLoadingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    const s = status || 'pending';
    const cls =
      s === 'pending'
        ? 'bg-yellow-200 text-yellow-800'
        : s === 'partial'
        ? 'bg-indigo-600 text-white'
        : s === 'received'
        ? 'bg-green-600 text-white'
        : s === 'canceled'
        ? 'bg-gray-600 text-white'
        : 'bg-gray-500 text-white';
    return <span className={`px-2 py-1 rounded ${cls}`}>{s}</span>;
  };

  // filter + sort (client-side)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? orders.filter((o) => String(o.supplier || '').toLowerCase().includes(q))
      : orders;

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      if (sortBy === 'supplier') {
        return String(a.supplier || '').localeCompare(String(b.supplier || '')) * dir;
      }
      if (sortBy === 'status') {
        return String(a.status || '').localeCompare(String(b.status || '')) * dir;
      }
      // createdAt
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return (ad - bd) * dir;
    });
  }, [orders, search, sortBy, sortDir]);

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'supplier' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <OrderForm onCreated={refetch} />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-3">
          <input
            type="search"
            className="border rounded px-3 py-2 w-64"
            placeholder="Search by supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-sm text-gray-500">{filtered.length} / {orders.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">
                <SortButton
                  label="Order Date"
                  field="createdAt"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border">Items</th>
              <th className="p-2 border">
                <SortButton
                  label="Supplier"
                  field="supplier"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border">
                <SortButton
                  label="Status"
                  field="status"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => {
              const isRowLoading = loadingId === order._id;
              const s = order.status || 'pending';
              const receiveLabel = s === 'partial' ? 'Receive Remaining' : 'Receive All';
              const receiveDisabled = isRowLoading || s === 'received' || s === 'canceled';

              return (
                <tr key={order._id}>
                  <td className="p-2 border">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="p-2 border">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((i, idx) => (
                        <span key={`${order._id}-${idx}`} className="block">
                          {i.name} ({i.quantity} {i.unit})
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No items</span>
                    )}
                  </td>
                  <td className="p-2 border">{order.supplier || '-'}</td>
                  <td className="p-2 border">{renderStatusBadge(s)}</td>
                  <td className="p-2 border">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-2 py-1 rounded bg-indigo-600 text-white disabled:opacity-60"
                        disabled={receiveDisabled}
                        onClick={() => handleAutoReceive(order._id)}
                        type="button"
                        title={receiveLabel}
                      >
                        {isRowLoading ? 'Processing…' : receiveLabel}
                      </button>
                      <button
                        className="px-2 py-1 rounded bg-gray-600 text-white disabled:opacity-60"
                        disabled={isRowLoading || s === 'canceled' || s === 'received'}
                        onClick={() => handleCancel(order._id)}
                        type="button"
                        title="Cancel order"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={5}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}