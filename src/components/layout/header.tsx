"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const { isAuthenticated, clearAuth } = useAuthStore();
  const { user, clearUser } = useUserStore();

  const handleLogout = () => {
    clearAuth();
    clearUser();
    router.push("/dang-nhap");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Trang Chủ" },
    { href: "#", label: "Bản Đồ Quy Hoạch" },
    { href: "/du-an", label: "Dự Án" },
    { href: "/tin-tuc", label: "Tin Tức" },
    { href: "/mua-ban", label: "Mua Bán" },
    { href: "/cho-thue", label: "Cho Thuê" },
    { href: "/moi-gioi", label: "Môi Giới" },
  ];

  const getLinkClass = (href: string) => {
    // Exact match for home, startsWith for others to highlight subpages
    const isActive = href === "/" ? pathname === "/" : pathname?.startsWith(href) && href !== "#";

    return isActive
      ? "text-primary font-medium border-b-2 border-primary py-4.5 h-14 flex items-center"
      : "text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary font-medium py-4.5 h-14 flex items-center transition-colors";
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex-shrink-0 flex items-center">
            <Link className="text-2xl font-bold text-emerald-700 tracking-tight" href="/">
              finland.vn
            </Link>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm">
            {navLinks.map((link, index) => (
              <Link key={index} className={getLinkClass(link.href)} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/tai-khoan" className="flex items-center space-x-2 hover:opacity-75 transition-opacity">
                  <div className="size-8 rounded-full bg-emerald-100 dark:bg-slate-800 flex items-center justify-center border border-emerald-200 dark:border-slate-700">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="size-full rounded-full object-cover" />
                    ) : (
                      <User className="size-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {user?.full_name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="size-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/dang-nhap"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm hover:text-primary dark:hover:text-primary hover:border-primary dark:hover:border-primary transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-sm transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2" type="button">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}