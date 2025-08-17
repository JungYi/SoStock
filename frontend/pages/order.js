// frontend/pages/order.js
import { useEffect, useState } from "react";

export default function OrderList() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5050/api/order")
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error("❌ Failed to fetch orders:", err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      <table className="w-full border border-gray-300 text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Order Date</th>
            <th className="p-2 border">Items</th>
            <th className="p-2 border">Supplier</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td className="p-2 border">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="p-2 border">
                {order.items.map((i, idx) => (
                  <span key={idx} className="block">
                    {i.name} ({i.quantity} {i.unit})
                  </span>
                ))}
              </td>
              <td className="p-2 border">{order.supplier}</td>
              <td className="p-2 border">
                <span
                  className={`px-2 py-1 rounded text-white ${
                    order.status === "pending"
                      ? "bg-yellow-500"
                      : order.status === "received"
                      ? "bg-green-600"
                      : "bg-gray-500"
                  }`}
                >
                  {order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}