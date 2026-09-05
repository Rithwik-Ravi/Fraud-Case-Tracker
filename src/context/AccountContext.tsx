"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

interface AccountContextType {
  phone: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  phone: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 5) return phone || "";
  return `${phone.slice(0, 2)}xxxxx${phone.slice(-3)}`;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      const data = await res.json();
      setPhone(data.phone ?? null);
    } catch {
      setPhone(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signout" }),
      });
    } catch {}
    setPhone(null);
  }, []);

  const value = useMemo(
    () => ({
      phone,
      loading,
      refresh,
      signOut,
    }),
    [phone, loading, refresh, signOut]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  return useContext(AccountContext);
}
