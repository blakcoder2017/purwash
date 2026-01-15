import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from "react-native";
import { Order, OrderStatus } from "../types";
import { getPendingOrders, updateOrderStatus } from "../api/rider";

const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  assigned: "on_my_way_to_pick",
  on_my_way_to_pick: "picked_up",
  picked_up: "dropped_at_laundry",
  ready_for_pick: "out_for_delivery",
  out_for_delivery: "delivered",
};

const statusLabel: Partial<Record<OrderStatus, string>> = {
  assigned: "Start pickup",
  on_my_way_to_pick: "Picked up",
  picked_up: "Dropped at laundry",
  ready_for_pick: "Out for delivery",
  out_for_delivery: "Mark delivered",
};

const MissionScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPendingOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdate = async (orderId: string, status: OrderStatus) => {
    const nextStatus = nextStatusMap[status];
    if (!nextStatus) return;
    try {
      await updateOrderStatus(orderId, nextStatus);
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, status: nextStatus } : order
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to update status.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Missions</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOrders} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No active missions.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order #{item.friendlyId}</Text>
            <Text style={styles.meta}>Status: {item.status.replace(/_/g, " ")}</Text>
            <Text style={styles.meta}>Client: {item.client.phone}</Text>
            <Text style={styles.meta}>Address: {item.client.location.addressName}</Text>
            {statusLabel[item.status] && (
              <Pressable style={styles.button} onPress={() => handleUpdate(item._id, item.status)}>
                <Text style={styles.buttonText}>{statusLabel[item.status]}</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#0F172A" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  meta: { color: "#475569", marginBottom: 4 },
  button: { backgroundColor: "#0F172A", padding: 10, borderRadius: 10, marginTop: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#DC2626", marginBottom: 8 },
  empty: { color: "#64748B", textAlign: "center", marginTop: 24 },
});

export default MissionScreen;
