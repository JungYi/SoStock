import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import WeeklyReceivingChart from '../components/WeeklyReceivingChart';

export default function HomePage() {
  const [invCount, setInvCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [receiptTotal, setReceiptTotal] = useState(0);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [allReceipts, setAllReceipts] = useState([]); // 차트용 풀 데이터
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        // 병렬 로드
        const [invRes, orderRes, receiptRes] = await Promise.all([
          api.get('/inventory'),
          api.get('/order'),    // 클라에서 pending/partial 카운트
          api.get('/receipt'),  // 전체 레코드
        ]);
        if (!mounted) return;

        const invList = invRes.data || [];
        setInvCount(invList.length);

        const orders = orderRes.data || [];
        const pending = orders.filter((o) => o.status === 'pending' || o.status === 'partial').length;
        setPendingOrders(pending);

        const receipts = receiptRes.data || [];
        setReceiptTotal(receipts.length);
        setAllReceipts(receipts);

        // 최근 5건만 테이블로
        const recent = [...receipts]
          .sort((a, b) =>
            new Date(b.receivedAt || b.createdAt || 0) - new Date(a.receivedAt || a.createdAt || 0),
          )
          .slice(0, 5);
        setRecentReceipts(recent);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = useMemo(() => ([
    { label: 'Total Stock Items', value: invCount },
    { label: 'Pending Orders', value: pendingOrders },
    { label: 'Total Receipts', value: receiptTotal },
  ]), [invCount, pendingOrders, receiptTotal]);

  return (
    <div className="p-6 bg-brand-bg min-h-screen">
      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="text-3xl font-semibold mt-1">{loading ? '…' : k.value}</div>
          </div>
        ))}
      </div>

      {/* Weekly Receiving Chart */}
      <WeeklyReceivingChart receipts={allReceipts} />

      {/* Recent Receiving */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-3">Recent Receiving</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Items</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-center" colSpan={3}>Loading…</td>
                </tr>
              ) : recentReceipts.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={3}>No receipts yet.</td>
                </tr>
              ) : (
                recentReceipts.map((r) => (
                  <tr key={r._id}>
                    <td>
                      {r.receivedAt
                        ? new Date(r.receivedAt).toLocaleDateString()
                        : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-')}
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
    </div>
  );
}