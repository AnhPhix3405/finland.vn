"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Menu, X, LogIn, UserPlus, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const { isAuthenticated, clearAuth } = useAuthStore();
  const { user, clearUser } = useUserStore();

  // Close menu on navigation
  useEffect(() => {
    startTransition(() => {
      setIsMenuOpen(false);
    });
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    clearUser();
    setIsMenuOpen(false);
    router.push("/dang-nhap");
    router.refresh();
  };

  const navLinks = [
    { href: "/", label: "Trang Chủ" },
    { href: "/ban-do-quy-hoach", label: "Bản Đồ Quy Hoạch" },
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
      ? "text-primary font-medium border-b-2 border-primary py-4.5 h-[80px] flex items-center"
      : "text-gray-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary font-medium py-4.5 h-[80px] flex items-center transition-colors";
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[80px]">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center" aria-label="Trang chủ finland.vn">
              <div
                className="w-[40px] h-[40px] lg:w-[60px] lg:h-[60px] transition-all bg-[url('/imgs/logo.png')] bg-[length:100%_auto] bg-center bg-no-repeat mix-blend-multiply dark:mix-blend-normal"
                aria-label="finland.vn Logo"
              />
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
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-2"
              type="button"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-white dark:bg-slate-900 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
              <div
                className="w-[125px] h-[50px] bg-[url('/imgs/logo.png')] bg-[length:100%_auto] bg-center bg-no-repeat mix-blend-multiply dark:mix-blend-normal"
                aria-label="finland.vn Logo"
              />
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="size-6 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav className="flex flex-col">
                {navLinks.map((link, index) => {
                  const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href) && link.href !== "#";
                  return (
                    <Link
                      key={index}
                      href={link.href}
                      className={`px-6 py-4 text-sm font-semibold transition-colors ${isActive
                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-6 border-t dark:border-slate-800 space-y-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/tai-khoan"
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <User className="size-4" />
                    {user?.full_name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <LogOut className="size-4" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/dang-nhap"
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <LogIn className="size-4" />
                    Đăng nhập
                  </Link>
                  <Link
                    href="/dang-ky"
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white bg-emerald-600 rounded-lg text-center"
                  >
                    <UserPlus className="size-4" />
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}