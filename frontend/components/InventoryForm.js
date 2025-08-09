import { useState } from 'react';
import api from '../services/api';

const InventoryForm = ({ onAdd }) => {
  const [form, setForm] = useState({ name: '', category: '', quantity: '', unit: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, quantity } = form;
    if (!name || quantity < 0) {
      setError('Name is required and quantity must be ≥ 0');
      return;
    }

    try {
      const res = await api.post('/inventory', form);
      onAdd(); // 새로고침 or 리스트 리페치
      setForm({ name: '', category: '', quantity: '', unit: '' });
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to create item');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <h2 className="text-xl font-semibold">Add Inventory Item</h2>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border px-2 py-1 w-full" />
      <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="border px-2 py-1 w-full" />
      <input name="quantity" value={form.quantity} onChange={handleChange} type="number" placeholder="Quantity" className="border px-2 py-1 w-full" />
      <input name="unit" value={form.unit} onChange={handleChange} placeholder="Unit (e.g. pcs)" className="border px-2 py-1 w-full" />
      <button type="submit" className="bg-black text-white px-4 py-2 rounded">Add</button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
};

export default InventoryForm;