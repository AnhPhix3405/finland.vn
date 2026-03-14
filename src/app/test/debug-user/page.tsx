"use client";

import { useAuthStore } from "@/src/store/authStore";
import { useUserStore } from "@/src/store/userStore";
import { useEffect, useState } from "react";

export default function DebugUserPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { user } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Debug User State</h1>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Auth Store</h2>
          <div className="space-y-2">
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Access Token:</strong> {accessToken ? `✅ ${accessToken.substring(0, 20)}...` : "❌ None"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">User Store</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Full Name:</strong> {user.full_name}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
              <p><strong>Email:</strong> {user.email || "N/A"}</p>
              <p><strong>Avatar URL:</strong> {user.avatar_url || "N/A"}</p>
              <p><strong>Specialization:</strong> {user.specialization || "N/A"}</p>
              <p><strong>Province:</strong> {user.province || "N/A"}</p>
              <p><strong>Ward:</strong> {user.ward || "N/A"}</p>
              <p><strong>Is Active:</strong> {user.is_active ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Phone:</strong> {user.phone || "N/A"}</p>
              <p><strong>Created At:</strong> {user.created_at ? new Date(user.created_at).toLocaleString() : "N/A"}</p>
            </div>
          ) : (
            <p>❌ No user data</p>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Test Navigation:</h3>
          <div className="space-y-2 text-sm">
            <div><a href="/dang-nhap" className="text-blue-600 hover:underline">→ Đăng nhập</a></div>
            <div><a href="/dang-ky" className="text-blue-600 hover:underline">→ Đăng ký</a></div>
            <div><a href="/tai-khoan" className="text-blue-600 hover:underline">→ Trang tài khoản</a></div>
            <div><a href="/test/debug-broker" className="text-blue-600 hover:underline">→ Debug broker updates</a></div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
            <li>Try logging in from <a href="/dang-nhap" className="underline">đăng nhập page</a></li>
            <li>Check if user data appears above</li>
            <li>Check if header shows user info</li>
            <li>Try logging out and see if data clears</li>
          </ol>
        </div>
      </div>
    </div>
  );
}