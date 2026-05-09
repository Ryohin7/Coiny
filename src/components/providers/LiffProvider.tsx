"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import liff from "@line/liff";

interface LiffContextType {
  liff: typeof liff | null;
  isLoggedIn: boolean;
  userId: string | null;
  profile: any | null;
  emailID: string | null;
  isAdmin: boolean;
  isPro: boolean;
  idToken: string | null;
  error: string | null;
}

const LiffContext = createContext<LiffContextType>({
  liff: null,
  isLoggedIn: false,
  userId: null,
  profile: null,
  emailID: null,
  isAdmin: false,
  isPro: false,
  idToken: null,
  error: null,
});

export const useLiff = () => useContext(LiffContext);

export default function LiffProvider({ children }: { children: React.ReactNode }) {
  const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [emailID, setEmailID] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
          const token = liff.getIDToken();
          
          if (!token) {
            console.error("LIFF: Logged in but ID Token is null. Check openid scope.");
            setError("已登入但無法取得身分憑證。請確認 LINE Developers 設定中的 Scopes 已勾選 openid 並儲存。");
            return;
          }

          // 檢查 Token 是否過期 (使用更健壯的解碼方式)
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            const now = Math.floor(Date.now() / 1000);
            
            // 如果過期或即將過期（預留 30 秒緩衝）
            if (payload.exp && payload.exp < (now + 30)) {
              console.warn("LIFF: Token expired or about to expire, forcing re-login...");
              liff.logout();
              liff.login();
              return;
            }
          } catch (e) {
            console.error("LIFF: Failed to parse token for expiration check", e);
          }

          setProfile(profile);
          setUserId(profile.userId);
          setIdToken(token);
          setIsLoggedIn(true);

          // Sync user to Firestore and get emailID
          const res = await fetch("/api/user/sync", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              lineUserId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
            }),
          });
          const data = await res.json();
          if (data.emailID) {
            setEmailID(data.emailID);
            setIsPro(data.isPro || false);
            setIsAdmin(data.isAdmin || false);
          }
        } else {
          // 只在非首頁強制登入
          if (window.location.pathname !== "/") {
            liff.login();
          }
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
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                if (liff.isLoggedIn()) {
                  liff.logout();
                }
                window.location.reload();
              }}
              className="bg-primary text-white px-6 py-2 rounded-full font-bold"
            >
              重新登入並更新授權
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-100 text-gray-800 px-6 py-2 rounded-full font-medium"
            >
              重試
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 防止 Hydration Mismatch：初次渲染（Server-side）不應包含 window 邏輯
  if (!mounted) {
    return (
      <LiffContext.Provider value={{ liff: liffObject, isLoggedIn, userId, profile, emailID, isAdmin, isPro, idToken, error }}>
        <div style={{ opacity: 0 }}>{children}</div>
      </LiffContext.Provider>
    );
  }

  // 非首頁且未登入時，顯示跳轉畫面
  if (!isLoggedIn && window.location.pathname !== "/") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8F7F4] dark:bg-[#050505]">
        <div className="text-center space-y-6 flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* 旋轉外圈 */}
            <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            {/* 內部 Logo 閃爍 */}
            <div className="w-16 h-16 bg-gradient-to-tr from-primary to-[#F4A261] rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
              <span className="text-3xl drop-shadow-sm">🪙</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-800 dark:text-gray-100">準備進入 Coiny</h2>
            <p className="text-sm text-muted-foreground font-medium animate-pulse">正在為您連接 LINE 帳號...</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <LiffContext.Provider value={{ liff: liffObject, isLoggedIn, userId, profile, emailID, isAdmin, isPro, idToken, error }}>
      {children}
    </LiffContext.Provider>
  );
}
