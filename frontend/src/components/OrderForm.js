import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

/**
 * Create new order:
 * - Fetch inventory items for dropdown
 * - Build items array (name, itemId, quantity, unit, unitPrice)
 * - Validate and POST to /api/order
 *
 * Props:
 * - onCreated?: () => void  // optional callback to refresh list in parent
 */
const OrderForm = ({ onCreated }) => {
  // Supplier & meta
  const [supplier, setSupplier] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");

  // Inventory for selection
  const [inventory, setInventory] = useState([]);
  const inventoryMap = useMemo(() => {
    const map = new Map();
    inventory.forEach((i) => map.set(i._id, i));
    return map;
  }, [inventory]);

  // Order items
  const [items, setItems] = useState([
    { itemId: "", name: "", unit: "", quantity: 1, unitPrice: 0 },
  ]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch inventory options
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get("/inventory");
        setInventory(res.data || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load inventory options.");
      }
    };
    fetchInventory();
  }, []);

  // Handlers
  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      // Auto-fill snapshot fields when itemId changes
      if (field === "itemId") {
        const ref = inventoryMap.get(value);
        if (ref) {
          next[idx].name = ref.name || "";
          next[idx].unit = ref.unit || "pcs";
        } else {
          next[idx].name = "";
          next[idx].unit = "";
        }
      }
      return next;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { itemId: "", name: "", unit: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItemRow = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Basic validation before submit
  const validate = () => {
    if (!supplier.trim()) return "Supplier is required.";
    if (!items.length) return "At least one item is required.";

    for (const it of items) {
      if (!it.itemId) return "Please select an item.";
      if (!it.name?.trim()) return "Item name is missing.";
      if (it.quantity == null || Number(it.quantity) < 1)
        return "Quantity must be ≥ 1.";
      if (Number(it.unitPrice) < 0) return "Unit price cannot be negative.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      supplier: supplier.trim(),
      items: items.map((it) => ({
        itemId: it.itemId,
        name: it.name.trim(),
        quantity: Number(it.quantity),
        unit: it.unit || "pcs",
        unitPrice: Number(it.unitPrice || 0),
      })),
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
      notes: notes?.trim() || "",
    };

    try {
      setSubmitting(true);
      await api.post("/order", payload);
      // Reset form
      setSupplier("");
      setExpectedDate("");
      setNotes("");
      setItems([{ itemId: "", name: "", unit: "", quantity: 1, unitPrice: 0 }]);
      // Notify parent or fallback to reload
      if (typeof onCreated === "function") onCreated();
      else window.location.reload();
    } catch (e) {
      console.error(e);
      setError("Failed to create order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
      <h2 className="text-xl font-semibold">Create Order</h2>

      {/* Supplier */}
      <div>
        <label className="block text-sm mb-1">Supplier</label>
        <input
          className="border px-2 py-1 w-full"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="e.g. Maison Supply"
        />
      </div>

      {/* Expected date */}
      <div>
        <label className="block text-sm mb-1">Expected Date (optional)</label>
        <input
          type="date"
          className="border px-2 py-1 w-full"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
        />
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
                      onChange={(e) =>
                        handleItemChange(idx, "itemId", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleItemChange(idx, "quantity", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      className="border px-2 py-1 w-24"
                      placeholder="pcs"
                      value={it.unit}
                      onChange={(e) =>
                        handleItemChange(idx, "unit", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="border px-2 py-1 w-28"
                      value={it.unitPrice}
                      onChange={(e) =>
                        handleItemChange(idx, "unitPrice", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 border">
                    <button
                      type="button"
                      className="text-coffee-600 hover:underline"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                      title={items.length === 1 ? "At least one item" : "Remove"}
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
                    onClick={addItemRow}
                  >
                    + Add Item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          {submitting ? "Creating…" : "Create Order"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </form>
  );
};

export default OrderForm;