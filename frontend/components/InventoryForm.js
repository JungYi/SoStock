import { useState, useEffect } from 'react';
import api from '../services/api';

const DEFAULT = { name: '', category: '', quantity: '', unit: 'pcs' };

const validate = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required.';
  if (form.quantity === '' || Number.isNaN(Number(form.quantity))) {
    errors.quantity = 'Quantity is required.';
  } else if (Number(form.quantity) < 0) {
    errors.quantity = 'Quantity must be ≥ 0.';
  }
  // Optional: validate unit from a list
  return errors;
};

const InventoryForm = ({ onAdd, editItem, onUpdate }) => {
  const [form, setForm] = useState(DEFAULT);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      const { name, category, quantity, unit } = editItem;
      setForm({ name: name || '', category: category || '', quantity: String(quantity ?? ''), unit: unit || 'pcs' });
      setErrors({});
    } else {
      setForm(DEFAULT);
    }
  }, [editItem]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
      if (editItem) {
        await api.put(`/inventory/${editItem._id}`, payload);
        onUpdate?.();
      } else {
        await api.post('/inventory', payload);
        onAdd?.();
      }
      setForm(DEFAULT);
    } catch (err) {
      // Map server-side validation to UI
      const serverMsg = err?.response?.data?.error || 'Failed to save item.';
      alert(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-xl font-semibold">{editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>

      <div>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Name"
          className="border px-2 py-1 w-full"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <input
          name="category"
          value={form.category}
          onChange={onChange}
          placeholder="Category"
          className="border px-2 py-1 w-full"
        />
      </div>

      <div>
        <input
          name="quantity"
          value={form.quantity}
          onChange={onChange}
          type="number"
          placeholder="Quantity"
          className="border px-2 py-1 w-full"
          min={0}
        />
        {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>}
      </div>

      <div>
        <select
          name="unit"
          value={form.unit}
          onChange={onChange}
          className="border px-2 py-1 w-full"
        >
          <option value="pcs">pcs</option>
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="ml">ml</option>
          <option value="l">l</option>
          <option value="pack">pack</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-black text-white px-4 py-2 rounded disabled:opacity-60"
      >
        {editItem ? 'Update' : 'Add'}
      </button>
    </form>
  );
};

export default InventoryForm;