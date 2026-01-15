import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Order } from "../types";
import { getJobHistory } from "../api/rider";

const HistoryScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobHistory(20);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Past Jobs</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadHistory} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No past jobs.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order #{item.friendlyId}</Text>
            <Text style={styles.meta}>Status: {item.status.replace(/_/g, " ")}</Text>
            <Text style={styles.meta}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
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
  error: { color: "#DC2626", marginBottom: 8 },
  empty: { color: "#64748B", textAlign: "center", marginTop: 24 },
});

export default HistoryScreen;
