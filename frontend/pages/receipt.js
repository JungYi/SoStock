// frontend/pages/receipt.js
import { useEffect, useState } from 'react';
import ReceiptForm from '../components/ReceiptForm';
import api from '../services/api';

/**
 * Receipts Page
 * - Create receipt (increments inventory)
 * - List receipts (latest first)
 */
export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const refetch = () => setRefresh((n) => n + 1);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await api.get('/receipt');
        if (mounted) setReceipts(res.data || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch receipts:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [refresh]);

  return (
    <div className="p-6 space-y-6">
      <ReceiptForm onCreated={refetch} />

      <h1 className="text-2xl font-bold">Receipts</h1>
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
            {receipts.map((r) => (
              <tr key={r._id}>
                <td className="p-2 border">
                  {r.receivedAt ? new Date(r.receivedAt).toLocaleDateString() : '-'}
                </td>
                <td className="p-2 border">
                  {Array.isArray(r.items) && r.items.length > 0 ? (
                    r.items.map((i, idx) => (
                      <span key={`${r._id}-${idx}`} className="block">
                        {i.name} (+{i.quantity} {i.unit})
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No items</span>
                  )}
                </td>
                <td className="p-2 border">{r.notes || '-'}</td>
              </tr>
            ))}
            {receipts.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={3}>
                  No receipts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}