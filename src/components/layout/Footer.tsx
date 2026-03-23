import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1e293b] text-slate-300 pt-12 pb-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href="/" aria-label="Trang chủ finland.vn" className="inline-block mb-4 hover:opacity-80 transition-opacity">
              <div
                className="w-[40px] h-[40px] lg:w-[60px] lg:h-[60px] transition-all bg-[url('/imgs/logo.png')] bg-[length:100%_auto] bg-center bg-no-repeat drop-shadow-[0_0_4px_rgba(251,146,60,0.6)]"
                aria-label="finland.vn Logo"
              />
            </Link>
            <p className="text-slate-400 mb-4 leading-relaxed text-sm">
              Nền tảng tra cứu thông tin quy hoạch và dự án bất động sản uy tín hàng đầu tại Việt Nam.
            </p>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-4 uppercase tracking-wider">Thông tin liên hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px] mt-0.5">location_on</span>
                <span className="text-slate-400">Tầng 3, Tòa nhà Landmark, Quận Nam Từ Liêm, Hà Nội</span>
              </li>
              <li className="flex items-start">
                <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px] mt-0.5">location_on</span>
                <span className="text-slate-400">Tầng 5, Tòa nhà Bitexco, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center">
                <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px]">phone</span>
                <span className="text-slate-400">1900 1234</span>
              </li>
              <li className="flex items-center">
                <span className="material-symbols-outlined text-slate-400 mr-2 text-[18px]">email</span>
                <span className="text-slate-400">contact@finland.vn</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-base font-semibold text-white mb-4 uppercase tracking-wider">Sitemap</h4>
            <div className="grid grid-cols-2 gap-2">
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link className="hover:text-emerald-500 transition-colors" href="/">Trang Chủ</Link></li>
                <li><Link className="hover:text-emerald-500 transition-colors" href="#">Bản Đồ Quy Hoạch</Link></li>
                <li><Link className="hover:text-emerald-500 transition-colors" href="/du-an">Dự Án</Link></li>
              </ul>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link className="hover:text-emerald-500 transition-colors" href="/moi-gioi">Môi Giới</Link></li>
                <li><Link className="hover:text-emerald-500 transition-colors" href="#">Đánh Giá 2026</Link></li>
                <li><Link className="hover:text-emerald-500 transition-colors" href="#">Liên Hệ</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-700 text-center text-sm text-slate-500">
          <p>© 2024 finland.vn. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
