import OrderForm from "../components/OrderForm";
import { useEffect, useState } from "react";
import api from "../services/api";

export default function OrdersPage() {
  // State
  const [orders, setOrders] = useState([]);
  const [refresh, setRefresh] = useState(0); // trigger refetch
  const [loadingId, setLoadingId] = useState(null); // per-row loading

  // Helpers
  const refetch = () => setRefresh((n) => n + 1);

  // Fetch orders
  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      try {
        const res = await api.get("/order");
        if (mounted) setOrders(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch orders:", err);
      }
    };
    fetchOrders();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  // PATCH status: 'pending' | 'canceled' | 'received'
  const handleStatusChange = async (orderId, nextStatus) => {
    if (!orderId) return;
    try {
      setLoadingId(orderId);
      await api.patch(`/order/${orderId}/status`, { status: nextStatus });
      refetch();
    } catch (err) {
      console.error(err);
      alert("Failed to update order status.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Create Order */}
      <OrderForm onCreated={refetch} />

      {/* Orders Table */}
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Order Date</th>
              <th className="p-2 border">Items</th>
              <th className="p-2 border">Supplier</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isRowLoading = loadingId === order._id;
              return (
                <tr key={order._id}>
                  <td className="p-2 border">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-2 border">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((i, idx) => (
                        <span key={`${order._id}-${idx}`} className="block">
                          {i.name} ({i.quantity} {i.unit})
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No items</span>
                    )}
                  </td>
                  <td className="p-2 border">{order.supplier || "-"}</td>
                  <td className="p-2 border">
                    <span
                      className={`px-2 py-1 rounded ${
                        order.status === "pending" ? "bg-yellow-200 text-yellow-800"
                          : order.status === "received" ? "bg-green-600 text-white"
                          : order.status === "canceled" ? "bg-gray-600 text-white"
                          : "bg-gray-500 text-white"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2 border">
                    <div className="flex flex-wrap gap-2">
                      {/* Mark as Received */}
                      <button
                        className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-60"
                        disabled={
                          isRowLoading || order.status === "received"
                        }
                        onClick={() =>
                          handleStatusChange(order._id, "received")
                        }
                        title="Mark as received"
                      >
                        {isRowLoading ? "Saving..." : "Mark Received"}
                      </button>

                      {/* Cancel */}
                      <button
                        className="px-2 py-1 rounded bg-gray-600 text-white disabled:opacity-60"
                        disabled={
                          isRowLoading ||
                          order.status === "canceled" ||
                          order.status === "received"
                        }
                        onClick={() =>
                          handleStatusChange(order._id, "canceled")
                        }
                        title="Cancel order"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={5}>
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}