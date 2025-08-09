import InventoryList from '../components/InventoryList';
import InventoryForm from '../components/InventoryForm';
import { useState } from 'react';

const InventoryPage = () => {
  const [refresh, setRefresh] = useState(false);

  const handleAdd = () => {
    setRefresh(!refresh);
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Inventory Dashboard</h1>
      <InventoryForm onAdd={handleAdd} />
      <InventoryList key={refresh} />
    </main>
  );
};

export default InventoryPage;