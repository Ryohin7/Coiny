"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return (
      <div className="w-full min-h-screen relative flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md min-h-screen mx-auto flex flex-col pb-20 relative bg-gray-50 dark:bg-gray-950 shadow-2xl">
      {children}
      <BottomNav />
    </div>
  );
}
