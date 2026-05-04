import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import LiffProvider from "@/components/providers/LiffProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coiny - 聰明記帳",
  description: "自動彙整財政部發票，簡單高級的記帳體驗",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-gray-50 dark:bg-[#050505] text-black dark:text-white min-h-screen flex flex-col items-center">
        <LiffProvider>
          <main className="w-full max-w-md min-h-screen flex flex-col pb-20 relative">
            {children}
            <BottomNav />
          </main>
        </LiffProvider>
      </body>
    </html>
  );
}
