"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { 
    href: "/", 
    label: "Check",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
    )
  },
  { 
    href: "/log", 
    label: "Log",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
    )
  },
  { 
    href: "/ledger", 
    label: "Ledger",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    )
  },
  { 
    href: "/payments", 
    label: "Pay",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
    )
  },
  { 
    href: "/admin", 
    label: "Admin",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/></svg>
    )
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/5 pb-safe">
      <div className="mx-auto flex max-w-[480px] items-center justify-around px-2 py-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/" && pathname?.startsWith(tab.href));
          
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                isActive ? "text-primary scale-110" : "text-muted hover:text-foreground"
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-500 ${
                isActive ? "bg-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : ""
              }`}>
                {tab.icon}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                isActive ? "text-primary" : "text-muted"
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-3 h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
