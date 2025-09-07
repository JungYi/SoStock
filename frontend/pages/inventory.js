import InventoryList from '../components/InventoryList';
import InventoryForm from '../components/InventoryForm';
import { useState } from 'react';
import api from '../services/api';

export default function InventoryPage() {
  const [refresh, setRefresh] = useState(0);
  const [editItem, setEditItem] = useState(null);

  const refetch = () => setRefresh((n) => n + 1);

  const handleAdd = () => refetch();

  const handleUpdate = () => {
    setEditItem(null);
    refetch();
  };

  const handleEdit = (item) => {
    setEditItem(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-restricted-globals, no-alert
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      refetch();
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert('Failed to delete item');
    }
  };

  return (
    <main className="p-6 space-y-6 bg-brand-bg min-h-screen">
      <h1 className="text-2xl font-bold">Inventory Dashboard</h1>

      {/* Form Card */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">{editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
        <InventoryForm onAdd={handleAdd} onUpdate={handleUpdate} editItem={editItem} />
      </div>

      {/* List Card */}
      <InventoryList key={refresh} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  );
}