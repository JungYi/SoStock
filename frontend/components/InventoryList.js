import { useEffect, useState } from 'react';
import api from '../services/api';

const InventoryList = ({ onEdit, onDelete }) => {
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
          <li key={item._id} className="flex justify-between items-center border-b py-2">
            <span>{item.name} — {item.quantity} {item.unit}</span>
            <div className="space-x-2">
              <button
                className="bg-blue-500 text-white px-2 py-1 rounded"
                onClick={() => onEdit(item)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 text-white px-2 py-1 rounded"
                onClick={() => onDelete(item._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InventoryList;