"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const checkWidth = () => {
      if (window.innerWidth >= 1024) {
        setCollapsed(false);
      } else {
        setCollapsed(true);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);

    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const navLinks = [
    { href: "/admin", label: "Tổng quan", icon: "dashboard", exact: true },
    { href: "/admin/du-an", label: "Quản lý Dự án", icon: "domain", exact: false },
    { href: "/admin/bai-viet", label: "Quản lý Bài viết", icon: "description", exact: false },
    { href: "/admin/tin-tuc", label: "Quản lý Tin tức", icon: "newspaper", exact: false },
    { href: "/admin/moi-gioi", label: "Quản lý Môi giới", icon: "group", exact: false },
    { href: "/admin/doi-mat-khau", label: "Đổi mật khẩu", icon: "lock", exact: false },
  ];

  if (!isHydrated) {
    return (
      <aside className="w-16 bg-slate-900 flex flex-col h-full flex-shrink-0">
        <div className="h-16 px-3 flex items-center justify-center border-b border-slate-800">
          <span className="text-emerald-700 font-bold text-lg">F</span>
        </div>
        <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
          {navLinks.map((link) => (
            <div key={link.href} className="py-2.5 px-0 flex justify-center">
              <span className="material-symbols-outlined text-xl text-slate-400">business</span>
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} bg-slate-900 flex flex-col h-full flex-shrink-0 transition-all duration-300`}>
      <div className={`h-16 ${collapsed ? "px-3 justify-center" : "px-6"} flex items-center gap-2 border-b border-slate-800 flex-shrink-0 overflow-hidden`}>
        {collapsed ? (
          <div
            className="w-[40px] h-[40px] bg-[url('/imgs/logo.png')] bg-[length:100%_auto] bg-center bg-no-repeat mix-blend-screen dark:mix-blend-screen"
            aria-label="finland.vn Logo"
          />
        ) : (
          <>
            <div
              className="w-[40px] h-[40px] bg-[url('/imgs/logo.png')] bg-[length:100%_auto] bg-center bg-no-repeat mix-blend-screen dark:mix-blend-screen"
              aria-label="finland.vn Logo"
            />
            <span className="text-emerald-400 font-bold text-lg">Admin</span>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
        {navLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} py-2.5 transition-colors ${isActive
                ? `${collapsed ? "px-0 rounded-sm" : "pl-2 pr-3 rounded-r-sm border-l-4 border-emerald-400"} bg-emerald-900/40 text-emerald-400 font-medium`
                : `${collapsed ? "px-0 rounded-sm" : "px-3 rounded-sm"} text-slate-300 hover:bg-slate-800 hover:text-white`
                }`}
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-800 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} w-full py-2.5 rounded-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer`}
        >
          <span className={`material-symbols-outlined text-xl transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>keyboard_double_arrow_left</span>
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}
