'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronDown, MapPin, Phone, FileText, Calendar, Building,
  Newspaper, Key, Users, LogIn, UserPlus, Home as HomeIcon, Megaphone,
  Library, BadgeDollarSign, Calculator, BookOpen, FileEdit, FileSearch,
  HandCoins, Coins, Crown
} from "lucide-react";
import { PropertyCard } from "@/src/components/property/PropertyCard";

type SearchCategory = "du-an" | "mua-ban" | "cho-thue";

const categories: { value: SearchCategory; label: string; placeholder: string }[] = [
  { value: "du-an", label: "Dự án", placeholder: "Tìm kiếm theo tên dự án..." },
  { value: "mua-ban", label: "Mua bán", placeholder: "Tìm kiếm theo tiêu đề bài đăng hoặc tên tác giả..." },
  { value: "cho-thue", label: "Cho thuê", placeholder: "Tìm kiếm theo tiêu đề bài đăng hoặc tên tác giả..." },
];

function QuickLink({
  href,
  label,
  icon: Icon,
  iconColor = "text-emerald-600",
  bgColor = "bg-emerald-50 dark:bg-emerald-900/20",
}: {
  href: string;
  label: string;
  icon: any;
  iconColor?: string;
  bgColor?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group`}
    >
      <div className={`w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
        {label}
      </span>
    </Link>
  );
}

function HomeSearchWidget() {
  const router = useRouter();
  const [category, setCategory] = useState<SearchCategory>("mua-ban");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selected = categories.find((c) => c.value === category)!;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const path = query ? `/${category}?search=${encodeURIComponent(query)}` : `/${category}`;
    router.push(path);
  };

  return (
    <div className="w-full max-w-2xl mx-auto shadow-2xl rounded-lg overflow-visible">
      <form onSubmit={handleSearch} className="flex rounded-lg overflow-visible">
        {/* Category Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 h-full px-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-sm border-r border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap rounded-l-lg"
          >
            {selected.label}
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 overflow-hidden">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value);
                    setDropdownOpen(false);
                    setSearchQuery("");
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${category === cat.value
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selected.placeholder}
            className="w-full h-12 pl-4 pr-4 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex items-center gap-2 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition-colors rounded-r-lg"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Tìm kiếm</span>
        </button>
      </form>
    </div>
  );
}

const DEFAULT_PROJECT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuAH-qH24_KE8TIFtAOlg2VMxFw51PbmagHsDz-fp6Y_o13wCplh0YpY5tUVGtFy_1YJB66cE-ffhS1bk0Khp5Id5HsZm2Vn7isAq4e3dgAm2smw-oxIc6ZJMRAczbqKi_kj0UIofIfDnHxU34GvPlK-Og0xGinm9wGIfWLsRQ9fqzoYOYfmBA-cQ32_dFeyQ0cYN5hgai2CsH15n0rd3N0dVC5HbLBDzPaUbpyyq_mUnWXQDljSIAPURnziqfdaHPhnGT183UxhHGub";

interface FeaturedProject {
  id: string;
  name: string;
  slug: string | null;
  thumbnail_url: string | null;
  province: string | null;
  ward: string | null;
  area: number | null;
  status: string | null;
}

function FeaturedProjects() {
  const [projects, setProjects] = useState<FeaturedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects?limit=3&sortBy=popular')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProjects(res.data || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const location = [project.ward, project.province].filter(Boolean).join(", ");
        return (
          <div key={project.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:shadow-lg transition-all duration-300 rounded-sm overflow-hidden group">
            <Link href={`/du-an/${project.slug || project.id}`} className="relative h-48 block overflow-hidden">
              <img alt={project.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={project.thumbnail_url || DEFAULT_PROJECT_IMAGE} />
              {project.status && <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 uppercase rounded-sm z-10">{project.status}</div>}
            </Link>
            <div className="p-4 flex-grow flex flex-col">
              <Link href={`/du-an/${project.slug || project.id}`} className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-emerald-600 transition-colors leading-snug">
                {project.name}
              </Link>
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-3">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {location || "Đang cập nhật"}
              </div>
              <div className="mt-auto flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-tight">Dự án</span>
                {project.area && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{project.area.toLocaleString()} m²</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeaturedBrokers() {
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brokers?limit=3&is_active=true')
      .then(r => r.json())
      .then(res => {
        if (res.success) setBrokers(res.data || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonBroker key={i} />)}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {brokers.map(broker => (
        <div key={broker.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center group">
          <div className="relative w-24 h-24 mb-4 overflow-hidden rounded-full border-2 border-slate-100 dark:border-slate-700 group-hover:border-emerald-500 transition-colors">
            <img 
              src={broker.avatar_url || "/imgs/no-avatar.jpg"} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              alt={broker.full_name} 
            />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 mb-1 group-hover:text-emerald-600 transition-colors">{broker.full_name}</h3>
          <p className="text-[10px] text-slate-500 mb-3 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800">
            {broker.ward && broker.ward + ", "}
            {broker.province || "Thành viên Finland"}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
              {broker._count?.listings || 0} bài đăng
            </span>
          </div>
          <button type="button" className="w-full py-1.5 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all rounded-sm uppercase tracking-wide cursor-default">
            Liên hệ
          </button>
        </div>
      ))}
    </div>
  );
}

function RecentNews() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/news?limit=3')
      .then(r => r.json())
      .then(res => {
        if (res.success) setNews(res.data || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map(item => (
        <div key={item.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
          <Link href={`/tin-tuc/${item.slug}`} className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
            {item.thumbnail_url ? (
              <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <span className="material-symbols-outlined text-4xl opacity-50">image</span>
            )}
          </Link>
          <div className="p-4 flex flex-col flex-grow">
            <Link href={`/tin-tuc/${item.slug}`} className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors leading-snug">
              {item.title}
            </Link>
            <div className="mt-auto flex items-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(item.created_at).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedListings({ type }: { type: "mua-ban" | "cho-thue" }) {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/listings?limit=3&hashtags=${type}&sortBy=popular`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setListings(res.data || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map(item => (
        <PropertyCard
          key={item.id}
          id={item.id}
          image={item.thumbnail_url || "/imgs/home-banner.jpg"}
          title={item.title}
          price={formatPrice(item.price)}
          area={`${item.area || 0} m²`}
          location={[item.ward, item.province].filter(Boolean).join(", ")}
          tags={item.tags?.map((t: any) => t.slug) || []}
          featureTags={item.featureTags}
          slug={item.slug}
          type={type}
        />
      ))}
    </div>
  );
}

function formatPrice(price: string | number | bigint | null) {
  if (!price) return "Thỏa thuận";
  const numPrice = Number(price);
  if (numPrice >= 1000000000) {
    return `${(numPrice / 1000000000).toFixed(1).replace(/\.0$/, "")} tỷ`;
  }
  if (numPrice >= 1000000) {
    return `${(numPrice / 1000000).toFixed(0)} triệu`;
  }
  return `${numPrice.toLocaleString()} đ`;
}

function SkeletonCard() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden animate-pulse">
      <div className="h-40 bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-full pt-2" />
      </div>
    </div>
  );
}

function SkeletonBroker() {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-6 rounded-sm flex flex-col items-center animate-pulse">
      <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full mb-4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="pb-12">
      <section className="relative bg-slate-900 min-h-[480px] py-16 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <img alt="Professional urban background" className="w-full h-full object-cover" src="/imgs/home-banner.jpg" />
        </div>
        <div className="relative z-20 text-center px-4 w-full flex flex-col justify-center items-center gap-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            Cổng thông tin Bất động sản &amp; Bản đồ Quy hoạch
          </h1>
          <HomeSearchWidget />
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLink href="/ban-do-quy-hoach" label="Bản đồ quy hoạch" icon={MapPin} iconColor="text-purple-600" bgColor="bg-purple-50 dark:bg-purple-900/20" />
            <QuickLink href="/du-an" label="Dự án" icon={Building} iconColor="text-rose-500" bgColor="bg-rose-50 dark:bg-rose-900/20" />
            <QuickLink href="/tin-tuc" label="Tin tức" icon={Newspaper} iconColor="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-900/20" />
            
            <QuickLink href="/mua-ban" label="Mua bán" icon={HomeIcon} iconColor="text-amber-600" bgColor="bg-amber-50 dark:bg-amber-900/20" />
            <QuickLink href="/cho-thue" label="Cho thuê" icon={Key} iconColor="text-green-600" bgColor="bg-green-50 dark:bg-green-900/20" />
            <QuickLink href="/moi-gioi" label="Môi giới" icon={Users} iconColor="text-orange-500" bgColor="bg-orange-50 dark:bg-orange-900/20" />
            
            <QuickLink href="/dang-nhap" label="Đăng nhập" icon={LogIn} iconColor="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-900/20" />
            <QuickLink href="/dang-ky" label="Đăng ký" icon={UserPlus} iconColor="text-emerald-500" bgColor="bg-emerald-50 dark:bg-emerald-900/20" />
            <QuickLink href="/dich-vu" label="Dịch vụ" icon={Megaphone} iconColor="text-sky-500" bgColor="bg-sky-50 dark:bg-sky-900/20" />
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Dự án nổi bật</h2>
            <Link className="text-xs text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center" href="/du-an">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </Link>
          </div>
          <FeaturedProjects />
        </div>
      </section>

      {/* Buy/Sell Listings */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Tin đăng mua bán</h2>
            <Link className="text-xs text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center" href="/mua-ban">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </Link>
          </div>
          <FeaturedListings type="mua-ban" />
        </div>
      </section>

      {/* Rent Listings */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Tin đăng cho thuê</h2>
            <Link className="text-xs text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center" href="/cho-thue">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </Link>
          </div>
          <FeaturedListings type="cho-thue" />
        </div>
      </section>

      {/* Featured Brokers */}
      <section className="py-12 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Môi giới chuyên nghiệp</h2>
            <Link className="text-xs text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center" href="/moi-gioi">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </Link>
          </div>
          <FeaturedBrokers />
        </div>
      </section>

      {/* Recent News */}
      <section className="py-12 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Tin tức & Tin tức quy hoạch</h2>
            <Link className="text-xs text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center" href="/tin-tuc">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </Link>
          </div>
          <RecentNews />
        </div>
      </section>
    </div>
  );
}