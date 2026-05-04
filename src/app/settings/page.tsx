"use client";

import { motion } from "framer-motion";
import { User, Mail, Shield, Bell, ChevronRight, Copy, ExternalLink } from "lucide-react";

export default function SettingsPage() {
  const forwardEmail = "user123@coiny.io";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(forwardEmail);
    alert("已複製轉寄地址！");
  };

  return (
    <div className="p-6 space-y-8">
      <header className="pt-4">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">設定</h1>
      </header>

      {/* User Profile */}
      <div className="flex items-center gap-4 px-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-xl">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Jacky Chen</h2>
          <p className="text-xs text-muted-foreground">Premium 帳戶</p>
        </div>
      </div>

      {/* Forwarding Section */}
      <section className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">發票自動彙整</h3>
        <div className="bg-black dark:bg-white text-white dark:text-black p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Mail size={18} />
              <h4 className="font-bold text-sm">您的專屬轉寄地址</h4>
            </div>
            <div className="flex items-center justify-between bg-white/10 dark:bg-black/10 p-4 rounded-2xl backdrop-blur-md">
              <code className="text-xs font-mono">{forwardEmail}</code>
              <button onClick={copyToClipboard} className="p-2 hover:scale-110 transition-transform">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[10px] opacity-70 leading-relaxed">
              請將財政部發票通知郵件轉寄至此地址，系統將自動為您解析明細並完成對帳。
            </p>
            <div className="pt-2">
              <button className="flex items-center gap-1 text-[10px] font-bold border-b border-current pb-0.5">
                如何設定自動轉寄 <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-2">一般設定</h3>
        <div className="space-y-2">
          {[
            { icon: Shield, label: "隱私與安全", color: "text-blue-500" },
            { icon: Bell, label: "通知設定", color: "text-purple-500" },
            { icon: User, label: "帳號資訊", color: "text-pink-500" },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass p-4 rounded-3xl flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl bg-gray-100 dark:bg-gray-800 ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-4">
        <p className="text-[10px] text-muted-foreground">Coiny v1.0.0 • Made with ❤️</p>
      </footer>
    </div>
  );
}
