import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { changePassword, updateProfile, verifyMomo } from "../api/rider";

const ProfileScreen: React.FC = () => {
  const { user, signOut, refreshProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.profile?.firstName || "",
    lastName: user?.profile?.lastName || "",
    phone: user?.profile?.phone || "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [momoForm, setMomoForm] = useState({ momoNumber: "", momoNetwork: "mtn" });
  const [message, setMessage] = useState<string | null>(null);

  const handleProfileSave = async () => {
    setMessage(null);
    try {
      await updateProfile({ profile: profileForm });
      await refreshProfile();
      setMessage("Profile updated.");
    } catch (err: any) {
      setMessage(err.message || "Failed to update profile.");
    }
  };

  const handlePasswordSave = async () => {
    setMessage(null);
    try {
      await changePassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setMessage("Password updated.");
    } catch (err: any) {
      setMessage(err.message || "Failed to update password.");
    }
  };

  const handleVerifyMomo = async () => {
    setMessage(null);
    try {
      await verifyMomo(momoForm);
      await refreshProfile();
      setMessage("MoMo verified.");
    } catch (err: any) {
      setMessage(err.message || "MoMo verification failed.");
    }
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.meta}>Name: {user.profile.firstName} {user.profile.lastName}</Text>
        <Text style={styles.meta}>Email: {user.email}</Text>
        <Text style={styles.meta}>Phone: {user.profile.phone}</Text>
        <Text style={styles.meta}>MoMo: {user.momo?.isVerified ? "Verified" : "Not verified"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Edit Profile</Text>
        <TextInput style={styles.input} placeholder="First name" value={profileForm.firstName} onChangeText={(v) => setProfileForm({ ...profileForm, firstName: v })} />
        <TextInput style={styles.input} placeholder="Last name" value={profileForm.lastName} onChangeText={(v) => setProfileForm({ ...profileForm, lastName: v })} />
        <TextInput style={styles.input} placeholder="Phone" value={profileForm.phone} onChangeText={(v) => setProfileForm({ ...profileForm, phone: v })} />
        <Pressable style={styles.button} onPress={handleProfileSave}>
          <Text style={styles.buttonText}>Save Profile</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <TextInput style={styles.input} placeholder="Current password" secureTextEntry value={passwordForm.currentPassword} onChangeText={(v) => setPasswordForm({ ...passwordForm, currentPassword: v })} />
        <TextInput style={styles.input} placeholder="New password" secureTextEntry value={passwordForm.newPassword} onChangeText={(v) => setPasswordForm({ ...passwordForm, newPassword: v })} />
        <Pressable style={styles.button} onPress={handlePasswordSave}>
          <Text style={styles.buttonText}>Update Password</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Verify MoMo</Text>
        <TextInput style={styles.input} placeholder="Network (mtn/vod/atl)" value={momoForm.momoNetwork} onChangeText={(v) => setMomoForm({ ...momoForm, momoNetwork: v })} />
        <TextInput style={styles.input} placeholder="MoMo number" value={momoForm.momoNumber} onChangeText={(v) => setMomoForm({ ...momoForm, momoNumber: v })} />
        <Pressable style={styles.button} onPress={handleVerifyMomo}>
          <Text style={styles.buttonText}>Verify MoMo</Text>
        </Pressable>
      </View>

      <Pressable style={[styles.button, styles.logout]} onPress={signOut}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#0F172A" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle: { fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0", padding: 12, borderRadius: 10, marginBottom: 8 },
  button: { backgroundColor: "#0F172A", padding: 12, borderRadius: 10, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontWeight: "600" },
  logout: { backgroundColor: "#DC2626" },
  meta: { color: "#475569", marginBottom: 4 },
  message: { color: "#16A34A", marginBottom: 8 },
});

export default ProfileScreen;
