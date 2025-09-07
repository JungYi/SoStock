import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const UNITS = ['pcs', 'pack', 'kg', 'g', 'l', 'ml'];

export default function InventoryForm({ onAdd, onUpdate, editItem }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState(''); // ✅ NEW
  const [quantity, setQuantity] = useState(0);
  const [unit, setUnit] = useState('pcs');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '');
      setCategory(editItem.category || '');
      setBrand(editItem.brand || ''); // ✅ NEW
      setQuantity(editItem.quantity ?? 0);
      setUnit(editItem.unit || 'pcs');
    } else {
      setName('');
      setCategory('');
      setBrand(''); // ✅
      setQuantity(0);
      setUnit('pcs');
    }
  }, [editItem]);

  const validate = () => {
    if (!name.trim()) return 'Name is required.';
    if (Number(quantity) < 0) return 'Quantity must be ≥ 0.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        category: category.trim(),
        brand: brand.trim(), // ✅
        quantity: Number(quantity),
        unit,
      };

      if (editItem?._id) {
        await api.put(`/inventory/${editItem._id}`, payload);
        toast.success('Item updated.');
        if (onUpdate) onUpdate();
      } else {
        await api.post('/inventory', payload);
        toast.success('Item added.');
        if (onAdd) onAdd();
      }
    } catch (err) {
      toast.error('Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        className="input w-full"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input w-full"
        placeholder="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        className="input w-full"
        placeholder="Brand (optional)"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      />
      <input
        type="number"
        className="input w-full"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        min="0"
        step="1"
      />
      <select
        className="input w-full"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
      >
        {UNITS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <div className="pt-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : (editItem ? 'Update' : 'Add')}
        </button>
      </div>
    </form>
  );
}