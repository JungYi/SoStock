import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

/**
 * ReceiptForm
 * - Optionally select an Order (pending/partial) to prefill items.
 * - Build receipt items and POST:
 *   - If order selected: POST /api/order/:orderId/receipt
 *   - Else: POST /api/receipt
 *
 * Props:
 * - onCreated?: () => void
 */

// Step helper
const stepForUnit = (u) => {
  const unit = String(u || '').toLowerCase();
  if (['pcs', 'ea', 'bag', 'pack'].includes(unit)) return '1'; // 정수만
  if (['kg', 'g', 'l', 'ml'].includes(unit)) return '0.001'; // 소수 허용
  return '1'; // 기본값: 보수적으로 정수
};

// Integer-only check
const isIntegerUnit = (u) => {
  const unit = String(u || '').toLowerCase();
  return ['pcs', 'ea', 'bag', 'pack'].includes(unit);
};

const ReceiptForm = ({ onCreated }) => {
  // Orders (pending/partial) for prefill
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  // Inventory for manual add (when no order selected, or to tweak unit)
  const [inventory, setInventory] = useState([]);
  const invMap = useMemo(() => {
    const m = new Map();
    inventory.forEach((i) => m.set(i._id, i));
    return m;
  }, [inventory]);

  // Form state
  const [items, setItems] = useState([
    { itemId: '', name: '', unit: '', quantity: 1, unitPrice: 0 },
  ]);
  const [receivedAt, setReceivedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load orders (pending, partial) & inventory
  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, invRes] = await Promise.all([
          api.get('/order', { params: { status: 'pending,partial' } }),
          api.get('/inventory'),
        ]);
        setOrders(ordersRes.data || []);
        setInventory(invRes.data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load orders/inventory.');
      }
    };
    load();
  }, []);

  // When an order is selected, prefill using remaining table
  const handleOrderSelect = async (orderId) => {
    setSelectedOrderId(orderId);
    setError('');
    if (!orderId) {
      setItems([{ itemId: '', name: '', unit: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    try {
      const res = await api.get(`/order/${orderId}/remaining`);
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) {
        setItems([{ itemId: '', name: '', unit: '', quantity: 1, unitPrice: 0 }]);
        return;
      }
      setItems(
        rows.map((r) => ({
          itemId: r.itemId,
          name: r.name,
          unit: r.unit || 'pcs',
          quantity: r.remaining > 0 ? r.remaining : 1,
          unitPrice: r.unitPrice || 0,
        })),
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError('Failed to prefill from order.');
    }
  };

  // Row edits
  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'itemId') {
        const ref = invMap.get(value);
        if (ref) {
          next[idx].name = ref.name || '';
          next[idx].unit = ref.unit || 'pcs';
        } else {
          next[idx].name = '';
          next[idx].unit = '';
        }
      }
      return next;
    });
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { itemId: '', name: '', unit: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeRow = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Validation
  const validate = () => {
    if (!items.length) return 'At least one item is required.';
    for (const it of items) {
      if (!it.itemId) return 'Please select an inventory item.';
      if (!it.name?.trim()) return 'Item name is missing.';

      const qty = Number(it.quantity);
      if (!Number.isFinite(qty) || qty < 1) return 'Quantity must be ≥ 1.';

      if (isIntegerUnit(it.unit) && !Number.isInteger(qty)) {
        return `Quantity must be an integer for unit "${it.unit}".`;
      }

      const up = Number(it.unitPrice || 0);
      if (!Number.isFinite(up) || up < 0) return 'Unit price cannot be negative.';
    }
    return '';
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const msg = validate();
    if (msg) {
      setError(msg);
      toast.error(msg);
      return;
    }

    const payload = {
      items: items.map((it) => ({
        itemId: it.itemId,
        name: it.name.trim(),
        quantity: Number(it.quantity),
        unit: it.unit || 'pcs',
        unitPrice: Number(it.unitPrice || 0),
      })),
      receivedAt: receivedAt ? new Date(receivedAt).toISOString() : undefined,
      notes: notes?.trim() || '',
    };

    try {
      setSubmitting(true);

      if (selectedOrderId) {
        await api.post(`/order/${selectedOrderId}/receipt`, {
          items: payload.items,
          receivedAt: payload.receivedAt,
          notes: payload.notes,
        });
      } else {
        await api.post('/receipt', payload);
      }

      toast.success('Receipt created.');
      // reset
      setItems([{ itemId: '', name: '', unit: '', quantity: 1, unitPrice: 0 }]);
      setReceivedAt('');
      setNotes('');
      setSelectedOrderId('');
      if (typeof onCreated === 'function') onCreated();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      const msgText = e?.response?.data?.error || 'Failed to create receipt.';
      setError(msgText);
      toast.error(msgText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
      <h2 className="text-xl font-semibold">Create Receipt</h2>

      {/* Order selector (optional) */}
      <div>
        <label className="block text-sm mb-1">Select Order (pending/partial)</label>
        <select
          className="border px-2 py-1 w-full"
          value={selectedOrderId}
          onChange={(e) => handleOrderSelect(e.target.value)}
        >
          <option value="">-- None --</option>
          {orders.map((o) => (
            <option key={o._id} value={o._id}>
              {o.supplier} · {new Date(o.createdAt).toLocaleDateString()} · {o.status}
            </option>
          ))}
        </select>
      </div>

      {/* Items table */}
      <div>
        <label className="block text-sm mb-2">Items</label>
        <div className="overflow-x-auto">
          <table className="w-full border text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Qty</th>
                <th className="p-2 border">Unit</th>
                <th className="p-2 border">Unit Price</th>
                <th className="p-2 border w-12">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">
                    <select
                      className="border px-2 py-1 w-full"
                      value={it.itemId}
                      onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                      disabled={!!selectedOrderId}
                    >
                      <option value="">Select item…</option>
                      {inventory.map((inv) => (
                        <option key={inv._id} value={inv._id}>
                          {inv.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      step={stepForUnit(it.unit)}
                      className="border px-2 py-1 w-24"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      className="border px-2 py-1 w-24"
                      placeholder="pcs"
                      value={it.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      className="border px-2 py-1 w-28"
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    />
                  </td>
                  <td className="p-2 border">
                    <button
                      type="button"
                      className="text-coffee-600 hover:underline"
                      onClick={() => removeRow(idx)}
                      disabled={items.length === 1}
                      title={items.length === 1 ? 'At least one item' : 'Remove'}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="p-2">
                  <button
                    type="button"
                    className="bg-gray-800 text-white px-3 py-1 rounded"
                    onClick={addRow}
                    disabled={!!selectedOrderId}
                    title={selectedOrderId ? 'Modify quantities/prices only' : 'Add a new row'}
                  >
                    + Add Item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ReceivedAt */}
      <div>
        <label className="block text-sm mb-1">Received At (optional)</label>
        <input
          type="date"
          className="border px-2 py-1 w-full"
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm mb-1">Notes (optional)</label>
        <textarea
          className="border px-2 py-1 w-full"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any remarks…"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Creating…' : 'Create Receipt'}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </form>
  );
};

export default ReceiptForm;