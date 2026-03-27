'use client';

import { MapPin, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toggleBookmark } from "@/src/app/modules/bookmarks.service";
import { useNotificationStore } from "@/src/store/notificationStore";
import { useAuthStore } from "@/src/store/authStore";

export interface FeatureTag {
  id: string;
  name: string;
  hashtag: string;
}

export interface PropertyCardProps {
  id: string;
  image: string;
  price: string;
  area: string;
  title: string;
  location: string;
  tags: string[];
  featureTags?: FeatureTag[];
  isPriority?: boolean;
  slug?: string | null;
  type?: "mua-ban" | "cho-thue" | "du-an";
  status?: string | null;
  isBookmarked?: boolean;
  onBookmarkToggle?: (isBookmarked: boolean) => void;
  showBookmark?: boolean;
  latitude?: number;
  longitude?: number;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  "Đang hiển thị": { label: "Đang hiển thị", color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
  "Đang chờ duyệt": { label: "Chờ duyệt", color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/40" },
  "Đã ẩn": { label: "Đã ẩn", color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
  "Hết hạn": { label: "Hết hạn", color: "text-orange-700", bg: "bg-orange-100 dark:bg-orange-900/40" },
  "Đã bán": { label: "Đã bán", color: "text-blue-700", bg: "bg-blue-100 dark:bg-blue-900/40" },
  "Đã xong": { label: "Đã xong", color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/40" },
  "Bị từ chối": { label: "Từ chối", color: "text-red-700", bg: "bg-red-100 dark:bg-red-900/40" },
};

const getStatusStyle = (status: string) => {
  const config = statusConfig[status];
  if (config) {
    return config;
  }
  // Default style for unknown statuses (like "sắp mở bán", "đang mở bán", etc.)
  return { label: status, color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-900/40" };
};

export function PropertyCard({
  id,
  image,
  price,
  area,
  title,
  location,
  tags,
  featureTags = [],
  isPriority = false,
  slug,
  type = "mua-ban",
  status = null,
  isBookmarked = false,
  onBookmarkToggle,
  showBookmark = true,
  latitude,
  longitude
}: PropertyCardProps) {
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useNotificationStore((state) => state.addToast);
  const accessToken = useAuthStore((state) => state.accessToken);

  // Use slug for URL, fallback to id if no slug
  const basePath =
    type === "cho-thue" ? "/cho-thue"
      : type === "du-an" ? "/du-an"
        : "/mua-ban";
  const detailUrl =
    type === "du-an"
      ? `${basePath}/${slug || id}`
      : slug ? `${basePath}/bai-dang/${slug}` : `${basePath}/bai-dang/${id}`;

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!accessToken) {
      addToast('Bạn cần đăng nhập để lưu bài đăng', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await toggleBookmark(id);
      if (result.success) {
        const newBookmarkedState = result.data.bookmarked;
        setBookmarked(newBookmarkedState);
        addToast(result.data.message, 'success', 2000);
        onBookmarkToggle?.(newBookmarkedState);
      } else {
        addToast(result.error, 'error');
      }
    } catch (error) {
      addToast('Lỗi khi thao tác bookmark', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden rounded-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
      <div className="relative aspect-video overflow-hidden">
        <div
          className="w-full h-full bg-cover bg-center rounded-t-sm transition-transform duration-500 group-hover:scale-110"
          style={{ backgroundImage: `url('${image}')` }}
          role="img"
          aria-label={title}
        />
        {showBookmark && (
          <button
            onClick={handleBookmarkClick}
            disabled={isLoading}
            className="absolute top-3 right-3 bg-white/80 dark:bg-slate-900/50 p-1.5 rounded-full hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors group disabled:opacity-50"
            aria-label={bookmarked ? "Bỏ lưu tin bất động sản" : "Lưu tin bất động sản"}
          >
            <Heart
              className={`w-5 h-5 transition-all ${bookmarked
                  ? 'fill-red-500 text-red-500'
                  : 'text-slate-400 group-hover:text-red-500'
                }`}
              aria-hidden="true"
            />
          </button>
        )}
        {status && status !== "Đang hiển thị" && (
          <div className={`absolute top-2 left-2 text-xs px-3 py-1.5 rounded-sm font-bold ${getStatusStyle(status).bg} ${getStatusStyle(status).color}`}>
            {getStatusStyle(status).label}
          </div>
        )}
        {isPriority && (
          <div className="absolute bottom-2 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wide">
            Tin ưu tiên
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col grow">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-black text-red-600">{price}</span>
          <span className="text-slate-500 font-semibold text-sm">
            • {area}
          </span>
        </div>
        <Link href={detailUrl}>
          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-2 hover:text-emerald-600 cursor-pointer transition-colors">
            {title}
          </h3>
        </Link>
        <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs mb-2">
          <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
          {location}
        </div>
        {featureTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {featureTags.map((feature, index) => (
              <span
                key={`feature-${feature.id || index}`}
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-sm border border-emerald-200 dark:border-emerald-800"
              >
                {feature.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4 mt-auto">
          {tags.map((tag, index) => (
            <span
              key={`tag-${index}`}
              className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
        <Link
          href={detailUrl}
          className="w-full mt-auto py-2 border border-slate-300 dark:border-slate-600 text-sm font-semibold hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors rounded-sm uppercase tracking-tight text-center block"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
