import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

/**
 * Create Receipt (increase inventory quantities)
 * - Fetch inventory options
 * - Build items array
 * - POST /api/receipt
 *
 * Props:
 * - onCreated?: () => void
 */
const ReceiptForm = ({ onCreated }) => {
  const [inventory, setInventory] = useState([]);
  const invMap = useMemo(() => {
    const m = new Map();
    inventory.forEach((i) => m.set(i._id, i));
    return m;
  }, [inventory]);

  const [items, setItems] = useState([
    { itemId: '', name: '', unit: '', quantity: 1, unitPrice: 0 },
  ]);

  const [receivedAt, setReceivedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load inventory
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/inventory');
        setInventory(res.data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError('Failed to load inventory list.');
      }
    };
    load();
  }, []);

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

  const validate = () => {
    if (!items.length) return 'At least one item is required.';
    for (const it of items) {
      if (!it.itemId) return 'Please select an inventory item.';
      if (!it.name?.trim()) return 'Item name is missing.';
      if (Number(it.quantity) < 1) return 'Quantity must be ≥ 1.';
      if (Number(it.unitPrice) < 0) return 'Unit price cannot be negative.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const msg = validate();
    if (msg) {
      setError(msg);
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
      await api.post('/receipt', payload);
      // reset
      setItems([{ itemId: '', name: '', unit: '', quantity: 1, unitPrice: 0 }]);
      setReceivedAt('');
      setNotes('');
      if (typeof onCreated === 'function') onCreated();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setError('Failed to create receipt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
      <h2 className="text-xl font-semibold">Create Receipt</h2>

      {/* Items */}
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
                      min="1"
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
                      className="text-red-600"
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