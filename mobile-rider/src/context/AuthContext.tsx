import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import * as riderApi from "../api/rider";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = await AsyncStorage.getItem("rider_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await riderApi.getProfile();
          setUser(profile.data.user);
        } catch (error) {
          await AsyncStorage.removeItem("rider_token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await riderApi.login(email, password);
    const authToken = response.data.token;
    await AsyncStorage.setItem("rider_token", authToken);
    setToken(authToken);
    setUser(response.data.user);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("rider_token");
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const profile = await riderApi.getProfile();
    setUser(profile.data.user);
  };

  const value = useMemo(
    () => ({ user, token, loading, signIn, signOut, refreshProfile }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
