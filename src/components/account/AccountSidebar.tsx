"use client";

import { User, List, Heart, Lock, LogOut, Edit2 } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";
import { useRouter } from "next/navigation";

export type AccountTab = "profile" | "listings" | "saved" | "password" | "wallet";

interface AccountSidebarProps {
  activeTab: AccountTab;
  onTabChange: (tab: AccountTab) => void;
  userName: string;
  userType: string;
}

export default function AccountSidebar({ activeTab, onTabChange, userName, userType }: AccountSidebarProps) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const { user, clearUser } = useUserStore();

  const handleLogout = () => {
    clearAuth();
    clearUser();
    router.push("/dang-nhap");
    router.refresh();
  };

  const menuItems = [
    { id: "profile", label: "Thông tin cá nhân", icon: User },
    { id: "listings", label: "Tin đăng của tôi", icon: List },
    { id: "saved", label: "Tin đã lưu", icon: Heart },
    { id: "password", label: "Đổi mật khẩu", icon: Lock },
  ];

  return (
    <aside className="w-full lg:w-1/4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
          <div 
            className="relative group cursor-pointer mb-4"
            onClick={() => onTabChange("profile")}
          >
            <div className="size-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center overflow-hidden border-4 border-emerald-100 dark:border-emerald-900/50">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={userName} 
                  className="size-full rounded-full object-cover" 
                />
              ) : (
                <User className="size-12" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1.5 rounded-full border-2 border-white dark:border-slate-900 shadow-md transition-transform group-hover:scale-110">
              <Edit2 className="size-3" />
            </div>
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{userName}</h3>
          <p className="text-sm text-emerald-600 font-medium">{userType}</p>
        </div>
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as AccountTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4 border-0"></div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm transition-colors"
          >
             <LogOut className="size-4" />
             Đăng xuất
          </button>
        </nav>
      </div>
    </aside>
  );
}
