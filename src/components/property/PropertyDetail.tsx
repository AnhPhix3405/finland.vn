"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  MapPin,
  Ruler,
  Maximize2,
  Compass,
  Phone,
  Share2,
  Heart,
  ChevronRight,
  Info,
  Clock,
  ShieldCheck,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Home,
  Tag,
  Hash,
  Building2
} from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toggleBookmark } from "@/src/app/modules/bookmarks.service";
import { useNotificationStore } from "@/src/store/notificationStore";
import { useAuthStore } from "@/src/store/authStore";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Attachment {
  id: string;
  secure_url: string;
  url?: string;
  original_name?: string | null;
  sort_order?: number;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  province: string;
  ward: string;
  address?: string | null;
  area?: number | null;
  price?: string | null;
  price_per_m2?: number | null;
  price_per_frontage_meter?: number | null;
  direction?: string | null;
  status?: string | null;
  slug?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  floor_count?: number | null;
  bedroom_count?: number | null;
  updated_at?: string | null;
  brokers: {
    id: string;
    full_name: string;
    phone: string;
    email?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  };
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  property_types?: {
    id: string;
    name: string;
    hashtag: string;
  } | null;
  transaction_types?: {
    id: string;
    name: string;
    hashtag: string;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
  developer?: string | null;
  project_code?: string | null;
  name?: string | null;
  thumbnail_url?: string | null;
}

interface PropertyDetailProps {
  type: "mua-ban" | "cho-thue" | "du-an";
  listing?: Listing | null;
  project?: any | null;
  attachments?: Attachment[];
  isBookmarked?: boolean;
  onBookmarkToggle?: (isBookmarked: boolean) => void;
  isDemo?: boolean;
}

export function PropertyDetail({ type, listing, project, attachments: propsAttachments, isBookmarked: propIsBookmarked, onBookmarkToggle, isDemo = false }: PropertyDetailProps) {
  const router = useRouter();
  const markerColor = type === "du-an" ? "#0ea5e9" : "#f97316";
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [startIndex, setStartIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(propIsBookmarked || false);
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(false);
  const addToast = useNotificationStore((state) => state.addToast);
  const accessToken = useAuthStore((state) => state.accessToken);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const lat = project?.latitude || listing?.latitude;
    const lng = project?.longitude || listing?.longitude;
    const hasCoords = (lat !== undefined && lat !== null) && (lng !== undefined && lng !== null);

    if (!hasCoords || !mapContainer.current) return;
    if (map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15,
      interactive: true
    });

    new mapboxgl.Marker({ color: markerColor })
      .setLngLat([lng, lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [listing?.latitude, listing?.longitude, project?.latitude, project?.longitude, markerColor]);

  // Use props attachments if provided, otherwise fetch from API
  useEffect(() => {
    if (propsAttachments && propsAttachments.length > 0) {
      setAttachments(propsAttachments);
      return;
    }

    if (!listing?.id) return;
    const fetchAttachments = async () => {
      try {
        const targetType = type === 'du-an' ? 'project' : 'listing';
        const res = await fetch(`/api/attachments?target_id=${listing?.id || project?.id}&target_type=${targetType}&limit=20`);
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          const sorted = (json.data || []).sort((a: Attachment, b: Attachment) => (a.sort_order || 0) - (b.sort_order || 0));
          setAttachments(sorted);
        }
      } catch (_err) {
        console.error("Error fetching listing attachments:", _err);
      }
    };
    fetchAttachments();
  }, [listing?.id, propsAttachments]);

  // Sync prop isBookmarked with state
  useEffect(() => {
    setIsBookmarked(propIsBookmarked || false);
  }, [propIsBookmarked]);

  const handleBookmarkClick = async () => {
    if (type === 'du-an') return;
    if (!accessToken) {
      addToast('Bạn cần đăng nhập để lưu bài đăng', 'error');
      return;
    }

    if (!listing?.id) return;

    setIsLoadingBookmark(true);
    try {
      const result = await toggleBookmark(listing.id);
      if (result.success) {
        const newBookmarkedState = result.data.bookmarked;
        setIsBookmarked(newBookmarkedState);
        onBookmarkToggle?.(newBookmarkedState);
        addToast(result.data.message, 'success', 2000);
      } else {
        addToast(result.error, 'error');
      }
    } catch (_error) {
      addToast('Lỗi khi thao tác bookmark', 'error');
    } finally {
      setIsLoadingBookmark(false);
    }
  };

  const scrollImages = (direction: "left" | "right") => {
    const thumbCount = 4;
    if (direction === "left" && startIndex > 0) {
      setStartIndex(startIndex - 1);
    } else if (direction === "right" && startIndex + thumbCount < attachments.length) {
      setStartIndex(startIndex + 1);
    }
  };

  const formatRelativeTime = (dateString?: string | null): string => {
    if (!dateString) return 'Không xác định';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return 'Vừa mới';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    if (diffMonths < 12) return `${diffMonths} tháng trước`;
    return `${diffYears} năm trước`;
  };

  const property = useMemo(() => {
    const formatPrice = (price?: string | number | null) => {
      if (!price) return "Thỏa thuận";
      const numPrice = Number(price);
      if (type === "mua-ban" || type === "du-an") {
        if (numPrice >= 1000000000) return `${(numPrice / 1000000000).toFixed(2)} Tỷ`;
        if (numPrice >= 1000000) return `${(numPrice / 1000000).toFixed(2)} Triệu`;
        if (numPrice >= 1000) return `${(numPrice / 1000).toFixed(0)} Nghìn`;
        return `${numPrice.toLocaleString("vi-VN")} VND`;
      } else {
        if (numPrice >= 1000000000) return `${(numPrice / 1000000000).toFixed(2)} Tỷ/tháng`;
        if (numPrice >= 1000000) return `${(numPrice / 1000000).toFixed(2)} Triệu/tháng`;
        if (numPrice >= 1000) return `${(numPrice / 1000).toFixed(0)} Nghìn/tháng`;
        return `${numPrice.toLocaleString("vi-VN")} VND/tháng`;
      }
    };

    const formatPricePerM2 = (pricePerM2?: number | null) => {
      let value = pricePerM2;
      const data = project || listing;
      if (!value && data?.price && data?.area) {
        value = Number(data.price) / Number(data.area);
      }

      if (!value || value <= 0) return "Không xác định";

      if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)} Tỷ/m²`;
      if (value >= 1000000) return `${(value / 1000000).toFixed(2)} Triệu/m²`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)} Nghìn/m²`;
      return `${Math.round(value)} VND/m²`;
    };

    const formatPricePerFrontage = (pricePerFrontageMeter?: number | null) => {
      if (!pricePerFrontageMeter) return "Không xác định";
      if (pricePerFrontageMeter >= 1000000000) return `${(pricePerFrontageMeter / 1000000000).toFixed(2)} Tỷ/m`;
      if (pricePerFrontageMeter >= 1000000) return `${(pricePerFrontageMeter / 1000000).toFixed(2)} Triệu/m`;
      return `${(pricePerFrontageMeter / 1000).toFixed(0)} Nghìn/m`;
    };

    const data = project || listing;
    if (data) {
      const isProject = !!project;
      return {
        id: data.id,
        title: isProject ? (data.name || "Dự án") : (data.title || "Bài đăng"),
        price: formatPrice(data.price),
        address: data.address
          ? (data.address.includes(data.ward || '') ? data.address : `${data.address}, ${data.ward}, ${data.province}`)
          : `${data.ward || ''}, ${data.province || ''}`,
        area: data.area || 0,
        bedrooms: (data as any).bedroom_count || 0,
        floors: (data as any).floor_count || 0,
        pricePerM2: formatPricePerM2(isProject ? null : (data as any).price_per_m2),
        pricePerFrontage: formatPricePerFrontage(isProject ? null : (data as any).price_per_frontage_meter),
        direction: (data as any).direction || "Không xác định",
        description: isProject ? (data.content || "") : (data.description || ""),
        broker: (data as any).brokers || {},
        contactName: isProject ? (data.brokers?.full_name || "Finland.vn Support") : (data.contact_name || data.brokers?.full_name),
        contactPhone: isProject ? (data.brokers?.phone || "0916.126.333") : (data.contact_phone || data.brokers?.phone || "Liên hệ"),
        contactAvatar: (data as any).brokers?.avatar_url,
        tags: isProject ? (data.project_tags?.map((t: any) => t.tags) || []) : (data.tags || []),
        propertyType: data.property_types?.name || (isProject ? "Dự án" : "Bất động sản"),
        transactionType: isProject ? "Dự án" : (data.transaction_types?.name || "Mua bán"),
        status: data.status || "Đang hiển thị",
        listingCode: isProject ? (data.project_code || data.id?.slice(0, 8)) : (data.listing_code || "N/A"),
        postedAt: null,
        updatedAt: (data as any).updated_at || (data as any).created_at,
        developer: isProject ? (data.developer || "") : ""
      };
    }

    // Fallback mock data for demo
    return {
      id: isDemo ? "DEMO-V3-2026" : "FIN26123456",
      title: type === "mua-ban"
        ? "Bán nhà mặt phố Nguyễn Trãi, Quận 1 - Vị trí kim cương, kinh doanh đa ngành"
        : "Cho thuê Kho xưởng KCN Tân Bình - Diện tích lớn, xe Container vào tận nơi",
      price: type === "mua-ban" ? "42.5 Tỷ" : "120 Triệu/tháng",
      address: type === "mua-ban"
        ? "Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
        : "Đường số 1, KCN Tân Bình, Quận Tân Phú, TP. Hồ Chí Minh",
      area: type === "mua-ban" ? 120 : 1500,
      bedrooms: type === "mua-ban" ? 5 : 0,
      floors: type === "mua-ban" ? 5 : 0,
      pricePerM2: "354.2 Triệu/m²",
      pricePerFrontage: "2.1 Tỷ/m",
      direction: "Đông Nam",
      description: "**Vị trí đắc địa** tại khu vực trung tâm. Pháp lý đầy đủ, sang tên ngay trong ngày.",
      broker: { full_name: "Trần Anh Hưng", phone: "0987.654.321", avatar_url: "https://i.pravatar.cc/150?u=anhhung" },
      contactName: "Trần Anh Hưng",
      contactPhone: "0987.654.321",
      contactAvatar: "https://i.pravatar.cc/150?u=anhhung",
      tags: [],
      propertyType: "Nhà phố",
      transactionType: "Mua bán",
      status: "Đang hiển thị",
      listingCode: "FIN26123456",
      postedAt: "11/03/2026", updatedAt: new Date().toISOString(),
    };
  }, [type, isDemo, listing]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors text-[11px] font-bold group"
          >
            <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại</span>
          </button>
          <div className="w-px h-2.5 bg-slate-200 dark:bg-slate-800" />
          <nav className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Trang chủ</span>
            <ChevronRight className="size-3" />
            <span>{type === "mua-ban" ? "Mua bán" : type === "cho-thue" ? "Cho thuê" : "Dự án"}</span>
            <ChevronRight className="size-3" />
            <span className="text-slate-600 dark:text-slate-200 font-medium">Chi tiết tin đăng</span>
          </nav>
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-[1.3] uppercase tracking-tight">
          {property.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 py-2 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <MapPin className="size-4" />
            <span>{property.address}</span>
          </div>
          {property.postedAt && (
            <div className="flex items-center gap-1">
              <Clock className="size-4" />
              <span>Đăng ngày {property.postedAt}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── IMAGES GALLERY ── */}
          {attachments.length > 0 ? (
            <div className="space-y-2">
              {/* Main image */}
              <div className="relative w-full h-95 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Image
                  src={attachments[selectedImageIndex]?.secure_url || attachments[0]?.secure_url}
                  alt={property.title}
                  fill
                  className="object-cover"
                  priority
                />
                {property.status && property.status !== "Đang hiển thị" && (
                  <div className="absolute top-3 left-3 text-[11px] px-2.5 py-1.5 rounded-md font-bold bg-white/90 dark:bg-slate-900/80 text-emerald-600 dark:text-emerald-400 backdrop-blur-sm">
                    {property.status}
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-1.5">
                  <Maximize2 className="size-3" />
                  {selectedImageIndex + 1}/{attachments.length} Ảnh
                </div>
              </div>

              {/* Thumbnails row with nav arrows */}
              <div className="relative">
                {startIndex > 0 && (
                  <button
                    onClick={() => scrollImages("left")}
                    className="absolute -left-9 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 shadow hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-full"
                  >
                    <ChevronLeft className="size-4 text-slate-600 dark:text-slate-400" />
                  </button>
                )}
                {startIndex + 4 < attachments.length && (
                  <button
                    onClick={() => scrollImages("right")}
                    className="absolute -right-9 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 shadow hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-full"
                  >
                    <ChevronRightIcon className="size-4 text-slate-600 dark:text-slate-400" />
                  </button>
                )}
                <div className="grid grid-cols-4 gap-2">
                  {attachments.slice(startIndex, startIndex + 4).map((attachment, index) => {
                    const actualIndex = startIndex + index;
                    const isLast = index === 3 && startIndex + 4 < attachments.length;
                    return (
                      <div
                        key={attachment.id}
                        className={`relative h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImageIndex === actualIndex ? "border-emerald-500" : "border-transparent"
                          } ${isLast ? "group" : ""}`}
                        onClick={() => setSelectedImageIndex(actualIndex)}
                      >
                        <Image
                          src={attachment.secure_url}
                          alt={attachment.original_name || `Ảnh ${actualIndex + 1}`}
                          fill
                          className="object-cover hover:opacity-80 transition-opacity"
                        />
                        {isLast && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">+{attachments.length - (startIndex + 4)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Placeholder khi chưa có ảnh */
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              {(project?.thumbnail_url || listing?.thumbnail_url) ? (
                <Image src={project?.thumbnail_url || listing?.thumbnail_url} fill className="object-cover" alt="thumbnail" />
              ) : (
                <div className="text-center text-slate-400">
                  <FileText className="size-12 mx-auto mb-2" />
                  <span className="text-sm">Chưa có hình ảnh</span>
                </div>
              )}
            </div>
          )}

          {/* Core Specs */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 mb-1 font-medium">Mức giá</span>
                <span className="text-2xl font-bold text-red-600 tracking-tight">{property.price}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 mb-1 font-medium">Diện tích</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{property.area} m²</span>
              </div>
              {property.pricePerM2 && property.pricePerM2 !== "Không xác định" && (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1 font-medium">Giá / m²</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{property.pricePerM2}</span>
                </div>
              )}
              {property.pricePerFrontage && property.pricePerFrontage !== "Không xác định" && (
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 mb-1 font-medium">Giá / mặt tiền</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{property.pricePerFrontage}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 mb-1 font-medium">Cập nhật</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatRelativeTime(property.updatedAt)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                  <Share2 className="size-5 text-slate-600" />
                </button>
                {type !== "du-an" && (
                  <button
                    onClick={handleBookmarkClick}
                    disabled={isLoadingBookmark}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <Heart
                      className={`size-5 transition-all ${isBookmarked
                        ? 'fill-red-500 text-red-500'
                        : 'text-slate-600'
                        }`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description — Markdown */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-emerald-600 pl-3">Thông tin mô tả</h3>
            <div className="markdown-content text-sm md:text-base">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ node, ...props }) => <img {...props} src={props.src || undefined} />
                }}
              >
                {property.description}
              </ReactMarkdown>
            </div>
          </div>

          {/* Feature List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-emerald-600 pl-3">Đặc điểm bất động sản</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-12 py-2">
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 py-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Home className="size-4" /> Số tầng
                </div>
                <span className="text-sm font-semibold">{property.floors > 0 ? `${property.floors} Tầng` : "---"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 py-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Home className="size-4" /> Số phòng ngủ
                </div>
                <span className="text-sm font-semibold">{property.bedrooms > 0 ? `${property.bedrooms} PN` : "---"}</span>
              </div>
              {property.developer && (
                <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 py-2">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Building2 className="size-4" /> Chủ đầu tư
                  </div>
                  <span className="text-sm font-semibold">{property.developer}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 py-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Compass className="size-4" /> Hướng nhà
                </div>
                <span className="text-sm font-semibold">{property.direction}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 py-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Home className="size-4" /> Loại hình
                </div>
                <span className="text-sm font-semibold">{property.propertyType}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 py-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Tag className="size-4" /> Nhu cầu
                </div>
                <span className="text-sm font-semibold">{property.transactionType}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 py-2">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Hash className="size-4" /> Mã tin
                </div>
                <span className="text-sm font-semibold">{property.listingCode}</span>
              </div>
            </div>
          </div>

          {/* Map Section */}
          {listing?.latitude && listing?.longitude && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-emerald-600 pl-3">Vị trí trên bản đồ</h3>
              <div className="w-full h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative group shadow-sm transition-all hover:shadow-md">
                <div ref={mapContainer} className="w-full h-full" />
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-2.5">
                    <div className="bg-orange-500/10 p-1.5 rounded-lg">
                      <MapPin className="size-4 text-orange-500" />
                    </div>
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Toạ độ chính xác</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {property.tags && property.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {property.tags.map((tag: Tag) => {
                const tagId = typeof tag === 'string' ? tag : tag.id;
                const tagName = typeof tag === 'string' ? tag : tag.name;
                return (
                  <span
                    key={tagId}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium cursor-default hover:text-emerald-600 transition-colors"
                  >
                    #{tagName}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column — Contact Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sticky top-24 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative size-14 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500">
                {property.contactAvatar ? (
                  <Image
                    src={property.contactAvatar}
                    alt={property.contactName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold text-lg">
                      {property.contactName?.charAt(0) || "?"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">{type === "du-an" ? "Quản lý bởi" : "Đăng bởi"}</p>
                <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{property.contactName}</h4>
                {type !== "du-an" && (
                  <div className="flex items-center gap-1 mt-1">
                    <ShieldCheck className="size-3 text-emerald-500" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Môi giới uy tín</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={`tel:${property.contactPhone}`}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <Phone className="size-5" />
                {property.contactPhone}
              </a>
              <button className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 font-bold py-3 rounded-lg transition-all active:scale-95">
                Gửi yêu cầu liên hệ
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400">
                <Info className="size-4 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-medium">
                  {type === "du-an"
                    ? "Dự án được phân phối chính thức bởi Finland.vn. Vui lòng liên hệ để nhận bảng giá và chính sách ưu đãi mới nhất."
                    : "Khi giao dịch, hãy yêu cầu xem giấy tờ gốc và tuyệt đối không chuyển khoản trước khi xem nhà."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}