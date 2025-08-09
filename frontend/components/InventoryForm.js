import { useState, useEffect } from 'react';
import api from '../services/api';

const InventoryForm = ({ onAdd, editItem, onUpdate }) => {
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unit: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editItem) {
      setForm(editItem);
    }
  }, [editItem]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || form.quantity < 0) {
      setError('Name is required and quantity must be ≥ 0');
      return;
    }

    try {
      if (editItem) {
        await api.put(`/inventory/${editItem._id}`, form);
        onUpdate();
      } else {
        await api.post('/inventory', form);
        onAdd();
      }
      setForm({ name: '', category: '', quantity: '', unit: '' });
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to save item');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <h2 className="text-xl font-semibold">
        {editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
      </h2>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border px-2 py-1 w-full" />
      <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="border px-2 py-1 w-full" />
      <input name="quantity" value={form.quantity} onChange={handleChange} type="number" placeholder="Quantity" className="border px-2 py-1 w-full" />
      <input name="unit" value={form.unit} onChange={handleChange} placeholder="Unit (e.g. pcs)" className="border px-2 py-1 w-full" />
      <button type="submit" className="bg-black text-white px-4 py-2 rounded">
        {editItem ? 'Update' : 'Add'}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
};

export default InventoryForm;