import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppWrapper from "@/components/layout/AppWrapper";
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
      <body className="bg-[#F8F7F4] dark:bg-[#050505] text-black dark:text-white min-h-screen">
        <LiffProvider>
          <AppWrapper>
            {children}
          </AppWrapper>
        </LiffProvider>
      </body>
    </html>
  );
}
