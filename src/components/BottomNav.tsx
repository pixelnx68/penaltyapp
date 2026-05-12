"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Log" },
  { href: "/ledger", label: "Ledger" },
  { href: "/payments", label: "Pay" },
  { href: "/admin", label: "Admin" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[480px]">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 items-center justify-center py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "text-black border-t-2 border-black -mt-px"
                  : "text-gray-400"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
