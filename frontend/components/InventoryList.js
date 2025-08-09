import { useEffect, useState } from 'react';
import api from '../services/api';

const InventoryList = () => {
  const [items, setItems] = useState([]);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <div className="space-y-2 mt-4">
      <h2 className="text-xl font-semibold">Inventory List</h2>
      <ul className="border rounded p-4">
        {items.map((item) => (
          <li key={item._id} className="flex justify-between border-b py-2">
            <span>{item.name}</span>
            <span>{item.quantity} {item.unit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InventoryList;