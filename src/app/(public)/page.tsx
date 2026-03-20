'use client';

import Link from "next/link";
import { useState } from "react";
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
      <p className="text-white/80 text-sm font-medium mb-3 text-center tracking-wide uppercase">
        Tìm kiếm trong Finland
      </p>
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

      {/* Search widget section replacing the 4 quick-links */}
      <section className="py-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Dự án nổi bật</h2>
            <Link className="text-sm text-primary hover:text-emerald-600 font-medium flex items-center" href="/du-an">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:border-primary transition-colors">
              <div className="relative h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Căn hộ cao cấp Vinhomes" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDegODUZ6REUfZ6wkYPWzTvrGzNKwi9JzombB3Jm48DAIJ6gU_Hcip9JPHZawF2rOio2uMXLrU1OxdeQEccJN8BVYW3aLazAcmZuCXbn17s81oYARqRzA-VpwhKIjoRnPYKUdiVh2LRe0G7cZ-0UnMSkC8uZokSoX-EuTpK-RoVvRFwTlG0oEnHn3JFa5oYq9rSfn0VyqzW2enpvmLRt07e7y42Ow2L-dFD6LKIXCOG6f-ZQ2E3R6496POzsn00YuELKLh2o2H1XF1O" />
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 uppercase rounded-sm">
                  Đang mở bán
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-primary cursor-pointer">Căn hộ cao cấp Vinhomes Grand Park</h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-3 truncate">
                  <span className="material-symbols-outlined text-[16px] mr-1 text-gray-400">location_on</span>
                  Quận 9, TP.HCM
                </div>
                <div className="flex justify-end items-center mb-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">75 m²</span>
                </div>
                <div className="mt-auto border-t border-gray-100 dark:border-slate-700 pt-4">
                  <Link className="block w-full text-center px-4 py-2 border border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm text-sm font-medium transition-colors" href="/du-an/demo">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:border-primary transition-colors">
              <div className="relative h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Khu đô thị Aqua City" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsMeEiB-shjejI2MZohhnY1E4ZqZviwN4BtQM5XyfoKFguCaoH4EIbZMQhQGIDbelvkQNbHOY7ok5w3aKy5kDO-GK9fwG32LrAi64RwxkqKX31C8IvFMjpwS6DuzYPfUJ9DkoeXM7dgN5aPywVa8Oaz0vzCZ7w5zzNzU50GzO_gJdjiajPHmAVDuygloybiE3FCYNujYDXPICxDdTh0rs4ZxLWLVqsy3L7PfTtoXfL_9-5QMKrut-C2w0YkFBF1IDkxczDnFMBsPTX" />
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 uppercase rounded-sm">
                  Sắp bàn giao
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-primary cursor-pointer">Khu đô thị sinh thái thông minh Aqua City</h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-3 truncate">
                  <span className="material-symbols-outlined text-[16px] mr-1 text-gray-400">location_on</span>
                  Biên Hòa, Đồng Nai
                </div>
                <div className="flex justify-end items-center mb-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">120 m²</span>
                </div>
                <div className="mt-auto border-t border-gray-100 dark:border-slate-700 pt-4">
                  <Link className="block w-full text-center px-4 py-2 border border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm text-sm font-medium transition-colors" href="/du-an/demo">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:border-primary transition-colors">
              <div className="relative h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Masteri Centre Point" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9b2hFSFxaOuDlxVhafP7OzZUSTbxay9I4hadpxI_oHuHGJcdagL-ls1TQ57H7kADtmWdGELHQWeDxwJN0LEpJw2evOuCDRd1VyhAxpg0B3pZDd0SKPM4Z9a_72kjBO46KWmTzCh0ceySePMso8k_Gs3fxJy9TWc80-HIKCfNRugpvfUXiyTQM5TcdjVlHj-Q8GIuvoFEvAJvK6k5j44g-lRwsbnA2ILZutTVtyEtB67anekCfI14HlaogL0PbtR9mgdgf1dGYoTbY" />
                <div className="absolute top-2 left-2 bg-gray-600 text-white text-xs font-bold px-2 py-1 uppercase rounded-sm">
                  Đã bàn giao
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-primary cursor-pointer">Khu căn hộ compound cao cấp Masteri Centre Point</h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-slate-400 mb-3 truncate">
                  <span className="material-symbols-outlined text-[16px] mr-1 text-gray-400">location_on</span>
                  Quận 9, TP.HCM
                </div>
                <div className="flex justify-end items-center mb-4">
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300">50 m²</span>
                </div>
                <div className="mt-auto border-t border-gray-100 dark:border-slate-700 pt-4">
                  <Link className="block w-full text-center px-4 py-2 border border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm text-sm font-medium transition-colors" href="/du-an/demo">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}