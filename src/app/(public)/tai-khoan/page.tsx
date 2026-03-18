"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";
import Link from "next/link";
import AccountSidebar, { AccountTab } from "../../../components/account/AccountSidebar";
import ProfileSection from "../../../components/account/ProfileSection";
import MyListingsSection from "../../../components/account/MyListingsSection";
import SavedListingsSection from "../../../components/account/SavedListingsSection";
import ChangePasswordSection from "../../../components/account/ChangePasswordSection";
import { useUserAuth } from "@/src/hooks/useUserAuth";

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  const { isLoading, isAuthenticated: isAuthed } = useUserAuth(() => {
    router.push('/dang-nhap');
  });

  if (isLoading || !isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSection />;
      case "listings":
        return <MyListingsSection />;
      case "saved":
        return <SavedListingsSection />;
      case "password":
        return <ChangePasswordSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-80px)]">
      <div className="mb-6 flex justify-end">
        <Link
          href="/tao-bai-dang"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-md transition-colors"
        >
          + Tạo bài đăng
        </Link>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <AccountSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userName={user?.full_name || "Tài khoản"}
          userType="Thành viên"
        />

        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
