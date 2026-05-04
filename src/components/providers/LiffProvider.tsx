"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";

interface LiffContextType {
  liff: typeof liff | null;
  isLoggedIn: boolean;
  userId: string | null;
  profile: any | null;
  error: string | null;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isLoggedIn: false,
  userId: null,
  profile: null,
  error: null,
});

export const useLiff = () => useContext(LiffContext);

export default function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error("Missing NEXT_PUBLIC_LIFF_ID");
        }

        await liff.init({ liffId });
        setLiffObject(liff);

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setProfile(profile);
          setUserId(profile.userId);
          setIsLoggedIn(true);
        } else {
          liff.login();
        }
      } catch (err: any) {
        console.error("LIFF Init Error", err);
        setError(err.message);
      }
    };

    initLiff();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <h1 className="text-xl font-bold text-red-500">LIFF 初始化失敗</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-2 rounded-full"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-white/10 rounded-full mx-auto animate-pulse" />
          <p className="text-white font-medium">正在跳轉至 LINE 登入...</p>
        </div>
      </div>
    );
  }

  return (
    <LiffContext.Provider value={{ liff: liffObject, isLoggedIn, userId, profile, error }}>
      {children}
    </LiffContext.Provider>
  );
}
