"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminHeader() {
  const pathname = usePathname();

  // Simple breadcrumb logic based on pathname
  let pageName = "Tổng quan";
  if (pathname?.includes("/du-an")) {
    pageName = pathname.split("/").length > 3 ? "Thông tin dự án" : "Quản lý Dự án";
  } else if (pathname?.includes("/bai-viet")) {
    pageName = pathname.split("/").length > 3 ? "Thông tin bài viết" : "Quản lý Bài viết";
  } else if (pathname?.includes("/moi-gioi")) {
    pageName = pathname.split("/").length > 3 ? "Thông tin môi giới" : "Quản lý Môi giới";
  }

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 h-full">
        <Link className="hover:text-primary transition-colors flex items-center h-full" href="/admin">
          Admin
        </Link>
        <span className="material-symbols-outlined text-sm mx-2">chevron_right</span>
        <span className="text-slate-900 dark:text-slate-100 flex items-center h-full">{pageName}</span>
      </div>
      <div className="flex items-center gap-4">
        <div
          className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-slate-300 dark:border-slate-600"
          title="Admin User Avatar Profile Picture"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEAVZBcQhCyc-guGbATPeAX8X5_tI7yoxPy03k3dofmRvy0jNy2VJOrLqpzx1qq_uTjJHmQ4IX4aADBnKeAuncRiIYleTSbutkD9ypM5DARxqkDJYr3CpLkl490J-ym3LSyctUB2bNx6VruPC-rLkQgb2OJPFr0ncMjFolLLh02tVikjc6_9Qqq32UxO2QPVV2yvrcT6hOtbbOndBsIF11iUVRarE3bcAHC84adfByrcLN2IgdVXkRkf_7WrSFaLU5AgEwzszbB8ji')",
          }}
        ></div>
      </div>
    </header>
  );
}
