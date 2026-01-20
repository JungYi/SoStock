import OrderForm from '../components/OrderForm';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
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
        toast.error('Failed to load orders.');
      }
    };
    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  // Cancel only (received는 자동 전이)
  const handleCancel = async (orderId) => {
    if (!orderId) return;
    // eslint-disable-next-line no-restricted-globals, no-alert
    if (!confirm('Cancel this order?')) return;
    try {
      setLoadingId(orderId);
      await api.patch(`/order/${orderId}/status`, { status: 'canceled' });
      toast.success('Order canceled.');
      refetch();
    } catch (e) {
      console.error('❌ Failed to cancel order:', e);
      toast.error('Failed to cancel order.');
    } finally {
      setLoadingId(null);
    }
  };

  // Auto-receive (All/Remaining) → 서버가 남은 수량 계산
  const handleAutoReceive = async (orderId) => {
    if (!orderId) return;
    try {
      setLoadingId(orderId);
      await api.post(`/order/${orderId}/receipt`, {});
      toast.success('Items received successfully.');
      refetch();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) toast('Already fully received.', { icon: 'ℹ️' });
      else toast.error('Failed to auto receive.');
    } finally {
      setLoadingId(null);
    }
  };

  // Status badge (브랜드 배지 유틸 적용)
  const renderStatusBadge = (status) => {
    const s = status || 'pending';
    const cls =
      s === 'pending'
        ? 'badge-pending'
        : s === 'partial'
        ? 'badge-partial'
        : s === 'received'
        ? 'badge-received'
        : s === 'canceled'
        ? 'badge-canceled'
        : 'badge';
    return <span className={cls}>{s}</span>;
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
    <div className="p-6 space-y-6 bg-brand-bg min-h-screen">
      {/* Create Order */}
      <div className="card">
        <OrderForm onCreated={refetch} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-3">
          <input
            type="search"
            className="input w-64"
            placeholder="Search by supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-sm text-gray-500">{filtered.length} / {orders.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto card">
        <table className="table">
          <thead>
            <tr>
              <th>
                <SortButton
                  label="Order Date"
                  field="createdAt"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th>Items</th>
              <th>
                <SortButton
                  label="Supplier"
                  field="supplier"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th>
                <SortButton
                  label="Status"
                  field="status"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onChange={handleSortChange}
                />
              </th>
              <th>Actions</th>
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
                  <td>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
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
                  <td>{order.supplier || '-'}</td>
                  <td>{renderStatusBadge(s)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-accent"
                        disabled={receiveDisabled}
                        onClick={() => handleAutoReceive(order._id)}
                        type="button"
                        title={receiveLabel}
                      >
                        {isRowLoading ? 'Processing…' : receiveLabel}
                      </button>
                      <button
                        className="btn btn-muted"
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