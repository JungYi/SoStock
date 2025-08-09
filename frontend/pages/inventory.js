import InventoryList from '../components/InventoryList';
import InventoryForm from '../components/InventoryForm';
import { useState } from 'react';
import api from '../services/api';

const InventoryPage = () => {
  const [refresh, setRefresh] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleAdd = () => {
    setRefresh(!refresh);
  };

  const handleUpdate = () => {
    setEditItem(null);
    setRefresh(!refresh);
  };

  const handleEdit = (item) => {
    setEditItem(item);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      setRefresh(!refresh);
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory Dashboard</h1>
      <InventoryForm onAdd={handleAdd} onUpdate={handleUpdate} editItem={editItem} />
      <InventoryList key={refresh} onEdit={handleEdit} onDelete={handleDelete} />
    </main>
  );
};

export default InventoryPage;