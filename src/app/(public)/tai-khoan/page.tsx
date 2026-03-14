"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";
import AccountSidebar, { AccountTab } from "../../../components/account/AccountSidebar";
import ProfileSection from "../../../components/account/ProfileSection";
import MyListingsSection from "../../../components/account/MyListingsSection";
import SavedListingsSection from "../../../components/account/SavedListingsSection";
import ChangePasswordSection from "../../../components/account/ChangePasswordSection";

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { user } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push("/dang-nhap");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
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
