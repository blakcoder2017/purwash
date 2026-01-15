import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { getWallet } from "../api/partner";

const EarningsScreen: React.FC = () => {
  const [totals, setTotals] = useState({ totalEarned: 0, pendingBalance: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWallet();
      const data = response.data;
      setTotals({
        totalEarned: data?.wallet?.totalEarned || 0,
        pendingBalance: data?.wallet?.pendingBalance || 0,
      });
      setTransactions(data?.transactions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load earnings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const paidOut = totals.totalEarned - totals.pendingBalance;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Earnings</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Available</Text>
          <Text style={styles.summaryValue}>₵{paidOut.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryValue}>₵{totals.pendingBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>₵{totals.totalEarned.toFixed(2)}</Text>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.sectionTitle}>History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item, idx) => item._id || `${idx}`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWallet} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No transactions.</Text> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order #{item.orderId?.friendlyId || item.orderId || "-"}</Text>
            <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            <Text style={styles.amount}>+ ₵{Number(item.amount || 0).toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#0F172A" },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  summaryCard: { flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  summaryLabel: { color: "#64748B", fontSize: 12 },
  summaryValue: { fontWeight: "700", marginTop: 4 },
  sectionTitle: { fontWeight: "700", marginTop: 8, marginBottom: 8 },
  card: { backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  cardTitle: { fontWeight: "700" },
  meta: { color: "#64748B", marginTop: 4 },
  amount: { color: "#16A34A", marginTop: 6, fontWeight: "700" },
  error: { color: "#DC2626", marginBottom: 8 },
  empty: { color: "#64748B", textAlign: "center", marginTop: 24 },
});

export default EarningsScreen;
