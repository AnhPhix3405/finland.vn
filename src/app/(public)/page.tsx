'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";

type SearchCategory = "du-an" | "mua-ban" | "cho-thue";

const categories: { value: SearchCategory; label: string; placeholder: string }[] = [
  { value: "du-an", label: "Dự án", placeholder: "Tìm kiếm theo tên dự án..." },
  { value: "mua-ban", label: "Mua bán", placeholder: "Tìm kiếm theo tiêu đề bài đăng hoặc tên tác giả..." },
  { value: "cho-thue", label: "Cho thuê", placeholder: "Tìm kiếm theo tiêu đề bài đăng hoặc tên tác giả..." },
];

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
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="flex shadow-xl rounded-lg overflow-visible">
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
    fetch('/api/projects?limit=3&sortBy=newest')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setProjects(res.data || []);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const skeletons = Array.from({ length: 3 });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletons.map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col animate-pulse">
            <div className="h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="p-4 flex flex-col gap-3">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mt-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
        Chưa có dự án nào.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const location = [project.ward, project.province].filter(Boolean).join(", ");
        const detailUrl = `/du-an/${project.slug || project.id}`;
        return (
          <div key={project.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:shadow-lg transition-shadow rounded-sm overflow-hidden">
            <div className="relative h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={project.name}
                className="w-full h-full object-cover"
                src={project.thumbnail_url || DEFAULT_PROJECT_IMAGE}
              />
              {project.status && (
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 uppercase rounded-sm">
                  {project.status}
                </div>
              )}
            </div>
            <div className="p-4 flex-grow flex flex-col">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-primary cursor-pointer">
                {project.name}
              </h3>
              {location && (
                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-3 truncate">
                  <span className="material-symbols-outlined text-[16px] mr-1 text-gray-400">location_on</span>
                  {location}
                </div>
              )}
              {project.area && (
                <div className="flex justify-end items-center mb-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
                    {project.area.toLocaleString("vi-VN")} m²
                  </span>
                </div>
              )}
              <div className="mt-auto border-t border-gray-100 dark:border-slate-700 pt-4">
                <Link
                  className="block w-full text-center px-4 py-2 border border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm text-sm font-medium transition-colors"
                  href={detailUrl}
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="relative bg-slate-900 h-[360px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Professional urban background" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeqzBaJOHIc8BHASzk_oyBJnP_tcXTf_Hp41fclK9xZmTwCv9SWG8_99fgWKtQ-1c7oLk6IaMylAsHWFhumNGK6n7FJs2UGkikJYapJ_CvbYpNEBDkrI4gMtlCztA9Q2u542XIWnRKRiITPhA8Ct3gt9PJmd5kn1Ekoh1uXLDt3J7PYRgtcKvjhFbb3xdxxvaSLp2io9jLMwsiHF12S5k5pMMunsBuVeCmBW3s38422BZTdcNcC1o7fzf3m3ITD5dRPdFtk6Ze9OEQ" />
        </div>
        <div className="relative z-20 text-center px-4 w-full flex flex-col justify-center items-center gap-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            Cổng thông tin Bất động sản &amp; Bản đồ Quy hoạch
          </h1>
          <HomeSearchWidget />
        </div>
      </section>

      <section className="py-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Dự án nổi bật</h2>
            <Link className="text-sm text-primary hover:text-emerald-600 font-medium flex items-center" href="/du-an">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </Link>
          </div>
          <FeaturedProjects />
        </div>
      </section>
    </>
  );
}