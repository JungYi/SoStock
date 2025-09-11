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
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Inventory Dashboard</h1>

      {/* 상단 2열: 좌(폼), 우(예약패널) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌: 폼 카드 (절반) */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">{editItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
          <InventoryForm key={editItem?._id || 'new'} onAdd={handleAdd} onUpdate={handleUpdate} editItem={editItem} />
        </section>

        {/* 우: 빈 카드(추후 기능용) */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-2">Reserved Panel</h2>
          <p className="text-sm text-gray-600">
            This area is reserved for future utilities (e.g., quick stats, bulk edit, import…).
          </p>
        </section>
      </div>

      {/* 하단: 리스트 전체폭 */}
      <section className="card">
        <InventoryList key={refresh} onEdit={handleEdit} onDelete={handleDelete} />
      </section>
    </main>
  );
}