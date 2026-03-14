export default function Home() {
  return (
    <>
      <section className="relative bg-slate-900 h-[360px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="Professional urban background" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeqzBaJOHIc8BHASzk_oyBJnP_tcXTf_Hp41fclK9xZmTwCv9SWG8_99fgWKtQ-1c7oLk6IaMylAsHWFhumNGK6n7FJs2UGkikJYapJ_CvbYpNEBDkrI4gMtlCztA9Q2u542XIWnRKRiITPhA8Ct3gt9PJmd5kn1Ekoh1uXLDt3J7PYRgtcKvjhFbb3xdxxvaSLp2io9jLMwsiHF12S5k5pMMunsBuVeCmBW3s38422BZTdcNcC1o7fzf3m3ITD5dRPdFtk6Ze9OEQ"/>
        </div>
        <div className="relative z-20 text-center px-4 w-full flex flex-col justify-center items-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            Cổng thông tin Bất động sản &amp; Bản đồ Quy hoạch
          </h1>
        </div>
      </section>

      <section className="py-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a className="border border-gray-200 dark:border-slate-700 rounded-sm p-4 flex flex-row items-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group" href="#">
              <span className="material-symbols-outlined text-primary mr-3 text-xl">map</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Bản đồ quy hoạch</span>
            </a>
            <a className="border border-gray-200 dark:border-slate-700 rounded-sm p-4 flex flex-row items-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group" href="#">
              <span className="material-symbols-outlined text-primary mr-3 text-xl">layers</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Kho bản đồ</span>
            </a>
            <a className="border border-gray-200 dark:border-slate-700 rounded-sm p-4 flex flex-row items-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group" href="#">
              <span className="material-symbols-outlined text-primary mr-3 text-xl">monetization_on</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Bản đồ giá đất</span>
            </a>
            <a className="border border-gray-200 dark:border-slate-700 rounded-sm p-4 flex flex-row items-center hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group" href="#">
              <span className="material-symbols-outlined text-primary mr-3 text-xl">help</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Hướng dẫn tra cứu</span>
            </a>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-slate-700 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Dự án nổi bật</h2>
            <a className="text-sm text-primary hover:text-emerald-600 font-medium flex items-center" href="/du-an">
              Xem tất cả <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:border-primary transition-colors">
              <div className="relative h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Căn hộ cao cấp Vinhomes" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDegODUZ6REUfZ6wkYPWzTvrGzNKwi9JzombB3Jm48DAIJ6gU_Hcip9JPHZawF2rOio2uMXLrU1OxdeQEccJN8BVYW3aLazAcmZuCXbn17s81oYARqRzA-VpwhKIjoRnPYKUdiVh2LRe0G7cZ-0UnMSkC8uZokSoX-EuTpK-RoVvRFwTlG0oEnHn3JFa5oYq9rSfn0VyqzW2enpvmLRt07e7y42Ow2L-dFD6LKIXCOG6f-ZQ2E3R6496POzsn00YuELKLh2o2H1XF1O"/>
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
                  <a className="block w-full text-center px-4 py-2 border border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm text-sm font-medium transition-colors" href="/du-an/demo">
                    Xem chi tiết
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:border-primary transition-colors">
              <div className="relative h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Khu đô thị Aqua City" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsMeEiB-shjejI2MZohhnY1E4ZqZviwN4BtQM5XyfoKFguCaoH4EIbZMQhQGIDbelvkQNbHOY7ok5w3aKy5kDO-GK9fwG32LrAi64RwxkqKX31C8IvFMjpwS6DuzYPfUJ9DkoeXM7dgN5aPywVa8Oaz0vzCZ7w5zzNzU50GzO_gJdjiajPHmAVDuygloybiE3FCYNujYDXPICxDdTh0rs4ZxLWLVqsy3L7PfTtoXfL_9-5QMKrut-C2w0YkFBF1IDkxczDnFMBsPTX"/>
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
                  <a className="block w-full text-center px-4 py-2 border border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm text-sm font-medium transition-colors" href="/du-an/demo">
                    Xem chi tiết
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex flex-col hover:border-primary transition-colors">
              <div className="relative h-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Masteri Centre Point" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9b2hFSFxaOuDlxVhafP7OzZUSTbxay9I4hadpxI_oHuHGJcdagL-ls1TQ57H7kADtmWdGELHQWeDxwJN0LEpJw2evOuCDRd1VyhAxpg0B3pZDd0SKPM4Z9a_72kjBO46KWmTzCh0ceySePMso8k_Gs3fxJy9TWc80-HIKCfNRugpvfUXiyTQM5TcdjVlHj-Q8GIuvoFEvAJvK6k5j44g-lRwsbnA2ILZutTVtyEtB67anekCfI14HlaogL0PbtR9mgdgf1dGYoTbY"/>
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
                  <a className="block w-full text-center px-4 py-2 border border-emerald-700 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-sm text-sm font-medium transition-colors" href="/du-an/demo">
                    Xem chi tiết
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}