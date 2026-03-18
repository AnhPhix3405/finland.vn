"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/src/store/adminStore";
import { useNotificationStore } from "@/src/store/notificationStore";
import { fetchWithRetry } from "@/src/lib/api/fetch-with-retry";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Stats {
  totalProjects: number;
  totalListings: number;
  totalBrokers: number;
  activeBrokers: number;
  trends: {
    projects: number;
    listings: number;
    brokers: number;
  };
}

export default function AdminDashboardPage() {
  const { accessToken } = useAdminStore();
  const addToast = useNotificationStore((state) => state.addToast);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!accessToken) return;
      
      try {
        const res = await fetchWithRetry("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          token: accessToken,
          isAdmin: true
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        } else {
          addToast(data.error || "Không thể tải thống kê", "error");
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        addToast("Lỗi kết nối", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [accessToken, addToast]);

  const StatCard = ({
    title,
    value,
    trend,
    icon,
    bgColor,
    textColor,
    trendLabel,
  }: {
    title: string;
    value: number;
    trend: number;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    trendLabel: string;
  }) => (
    <div className="bg-white dark:bg-slate-800 rounded-sm p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <div className={`p-2 ${bgColor} rounded-sm ${textColor}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {loading ? "..." : value.toLocaleString("vi-VN")}
        </p>
        <p className={`text-sm flex items-center gap-1 mt-1 ${
          trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}>
          {trend >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
          <span>{trend >= 0 ? "+" : ""}{trend}% {trendLabel}</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tổng quan hệ thống</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-base">calendar_today</span>
            <span className="capitalize">{today}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Tổng dự án"
            value={stats?.totalProjects ?? 0}
            trend={stats?.trends.projects ?? 0}
            icon={<span className="material-symbols-outlined text-xl">apartment</span>}
            bgColor="bg-primary/10"
            textColor="text-primary"
            trendLabel="so với tháng trước"
          />

          <StatCard
            title="Tổng bài viết"
            value={stats?.totalListings ?? 0}
            trend={stats?.trends.listings ?? 0}
            icon={<span className="material-symbols-outlined text-xl">article</span>}
            bgColor="bg-blue-500/10"
            textColor="text-blue-600 dark:text-blue-400"
            trendLabel="so với tháng trước"
          />

          <StatCard
            title="Môi giới hoạt động"
            value={stats?.activeBrokers ?? 0}
            trend={stats?.trends.brokers ?? 0}
            icon={<span className="material-symbols-outlined text-xl">people</span>}
            bgColor="bg-purple-500/10"
            textColor="text-purple-600 dark:text-purple-400"
            trendLabel="so với tháng trước"
          />
        </div>
      </div>
    </div>
  );
}
