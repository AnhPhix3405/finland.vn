import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Danh Sách Môi Giới - finland.vn",
};

export default function BrokerList() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <nav aria-label="Breadcrumb" className="flex text-sm text-slate-500 dark:text-slate-400 mb-2">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link className="hover:text-primary transition-colors" href="/">Trang chủ</Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-1">/</span>
                <span className="text-slate-700 dark:text-slate-200 font-medium">Danh sách môi giới</span>
              </div>
            </li>
          </ol>
        </nav>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white uppercase">Danh sách Môi giới chuyên nghiệp</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 border border-gray-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4 rounded-sm shadow-sm">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
            </div>
            <input className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 dark:text-white placeholder-slate-500 transition-colors" placeholder="Tên môi giới/Công ty..." type="text"/>
          </div>
        </div>
        <div className="flex-1 md:max-w-xs">
          <select className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 dark:text-white text-slate-700 transition-colors appearance-none">
            <option value="">Khu vực hoạt động</option>
            <option value="1">TP. Hồ Chí Minh</option>
            <option value="2">Hà Nội</option>
            <option value="3">Đà Nẵng</option>
            <option value="4">Đồng Nai</option>
            <option value="5">Bình Dương</option>
          </select>
        </div>
        <div className="flex-1 md:max-w-xs">
          <select className="w-full pl-3 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-slate-900 dark:text-white text-slate-700 transition-colors appearance-none">
            <option value="">Lĩnh vực chuyên môn</option>
            <option value="canho">Căn hộ</option>
            <option value="datnen">Đất nền</option>
            <option value="nhapho">Nhà phố</option>
            <option value="phaply">Pháp lý</option>
          </select>
        </div>
        <div>
          <button className="w-full md:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-sm transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] mr-1">filter_list</span> Lọc
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Item 1 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row gap-4 hover:border-emerald-500 transition-colors group">
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Nguyễn Văn A" className="w-24 h-24 object-cover border border-slate-200 dark:border-slate-600 rounded-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSCuHQDNlA1io0zQ4xJckY_lioPf_BpqtDzrkl44XNsYqADGXWiwQblDCmoriTPsQCmMcHVPAfTRijYubh4Vi6hTVs7uJ9qe4WyXdz34E4scXLsqSWlgnO8UNbWozhRREJK-Jgtugo95d0Qp9kWl2l4_nbhmSWauHSTQECBfB1DpVoNmIIVQ24Vlgv0-ULZAy12ngfjKCwSHi5OPfpxlDVdQckFA76eXo6GFvkpAz4_FlFHYk9c2UN9vNx_qyaXebh9fqNDcmq9PML"/>
          </div>
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors cursor-pointer">Nguyễn Văn A</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Công ty CP Bất động sản CBRE</p>
                </div>
                <div className="flex items-center text-yellow-500 text-sm">
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star_half</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">(4.8)</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1">work_history</span> 8 năm kinh nghiệm
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Quận 2</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Quận 9</span>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-sm border border-emerald-200 dark:border-emerald-800">Căn hộ cao cấp</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0 sm:min-w-[140px]">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors">
              <span className="material-symbols-outlined text-[18px] mr-1">call</span> Gọi ngay
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-medium rounded-sm transition-colors">
              Xem hồ sơ
            </button>
          </div>
        </div>

        {/* Item 2 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row gap-4 hover:border-emerald-500 transition-colors group">
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Trần Thị B" className="w-24 h-24 object-cover border border-slate-200 dark:border-slate-600 rounded-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxIp-JSVfMI8Lcq3Rl_8ERR8A-K4L1HVph-IcTNJYY9_0L0T1_FcQumEffPn589iKNmvPhNwgrgMnEjFIhaCLhWbcqZbtdow4L9EQEPJ3tS0RAyNIV8eKID6oSDLpM7AMT7tXCZK1DfKAlNplFj-x1tMBr7eS0vpnKFLJnr8Y5lvBX-ZUVK3F0nOxYpui8qTqaGyjRSQf4to9QkNa3u_IBBjZwhuBuEVNpCkdkhD07E5mjM-BDwF6TNsvCKRR6-9zozGfbzYWkbBja"/>
          </div>
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors cursor-pointer">Trần Thị B</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Savills Việt Nam</p>
                </div>
                <div className="flex items-center text-yellow-500 text-sm">
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">(5.0)</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1">work_history</span> 12 năm kinh nghiệm
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Quận 1</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Quận 3</span>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-sm border border-emerald-200 dark:border-emerald-800">Nhà phố thương mại</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0 sm:min-w-[140px]">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors">
              <span className="material-symbols-outlined text-[18px] mr-1">call</span> Gọi ngay
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-medium rounded-sm transition-colors">
              Xem hồ sơ
            </button>
          </div>
        </div>

        {/* Item 3 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row gap-4 hover:border-emerald-500 transition-colors group">
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Lê Hoàng C" className="w-24 h-24 object-cover border border-slate-200 dark:border-slate-600 rounded-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcOmzYy6Mx4HK-kEft6ie2AYfnl5n-QAMdoKxhz1H-lheMGIbb0yyOUv--eDnKRTZ0Jd2K_noTPoeTXNAE2HIQufdqTdioCawNponUlWNclsHi-aIdeLJk2w7NUSVNbF-0rZf1p0YcYZ2-2nLgw3dndasrSWr4gioozqRUcQuN1cqaUB8uG7pwvVLuxv3CQs1jakZMAVNRVesPX_AcMCKj4AtwbmIFK9G7JHizasVlWRXs_gKqnjRJlI8EFZnkIvLwvPRQEpza2Xbi"/>
          </div>
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors cursor-pointer">Lê Hoàng C</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Đất Xanh Miền Nam</p>
                </div>
                <div className="flex items-center text-yellow-500 text-sm">
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px] text-slate-300 dark:text-slate-600">star</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">(4.0)</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1">work_history</span> 5 năm kinh nghiệm
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Thủ Đức</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Bình Dương</span>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-sm border border-emerald-200 dark:border-emerald-800">Đất nền</span>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-sm border border-emerald-200 dark:border-emerald-800">Pháp lý</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0 sm:min-w-[140px]">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors">
              <span className="material-symbols-outlined text-[18px] mr-1">call</span> Gọi ngay
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-medium rounded-sm transition-colors">
              Xem hồ sơ
            </button>
          </div>
        </div>

        {/* Item 4 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row gap-4 hover:border-emerald-500 transition-colors group">
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Phạm Mai D" className="w-24 h-24 object-cover border border-slate-200 dark:border-slate-600 rounded-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBIyKbTlNAVlNtV5m3xQR3kKtQfOGFop6_noEsQ6SKGI2rPIXZU6aXG-kDZdjkrYywOxUZybpGFcyxjtAPqrbuVHEg20FJ-9S7RR_ErroHIAFV-6OL0VoARZ1bX8JubDB3O-LJkqUvVqbvba-LoldmmzBBh19A6SZU1ZMhkCGChLlRD-7pcCma-GdD9y4zunf0SbI2tsCvjcIkxO9301di8LK6OZ5pG7WAjmxArNMmpf4aA8s8JpvhKqDavDI5QU9e-NbGnxfgK0Yv"/>
          </div>
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors cursor-pointer">Phạm Mai D</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Môi giới tự do</p>
                </div>
                <div className="flex items-center text-yellow-500 text-sm">
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star_half</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">(4.6)</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1">work_history</span> 3 năm kinh nghiệm
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Quận 7</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Nhà Bè</span>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-sm border border-emerald-200 dark:border-emerald-800">Căn hộ</span>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-sm border border-emerald-200 dark:border-emerald-800">Cho thuê</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0 sm:min-w-[140px]">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors">
              <span className="material-symbols-outlined text-[18px] mr-1">call</span> Gọi ngay
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-medium rounded-sm transition-colors">
              Xem hồ sơ
            </button>
          </div>
        </div>

        {/* Item 5 */}
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row gap-4 hover:border-emerald-500 transition-colors group">
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Vũ Đình E" className="w-24 h-24 object-cover border border-slate-200 dark:border-slate-600 rounded-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcajEYfu4zj4kSMz3IDG8C4GQdivw0bTXx-K8Y_KJhJwPb4bGAj2AUFciFd5KmWWa4EgMkW654Wuu8odsLCCG38D4aPozPSSpnfEmXoK1erFfB5tbMyj_el6UO0_FVjcekvxZYmu5nrVKrNaYTNDgCdgZ65mHWhZkHnIeKrQnAcRMjjv8CgZ-UYR-ZtFHDmC2zP1Rti99z6B_zG1TnHEKEQPATQNdITL3_-7jSKtClVccqAL4IsvDR9Ykpqwk7zrVX3cOQQQ7ZLT-d"/>
          </div>
          <div className="flex-grow flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors cursor-pointer">Vũ Đình E</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Novaland Group</p>
                </div>
                <div className="flex items-center text-yellow-500 text-sm">
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="material-symbols-outlined text-[16px]">star</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-1">(4.9)</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="material-symbols-outlined text-[16px] mr-1">work_history</span> 10 năm kinh nghiệm
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Đồng Nai</span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-sm border border-slate-200 dark:border-slate-600">Bà Rịa - Vũng Tàu</span>
              <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-sm border border-emerald-200 dark:border-emerald-800">Biệt thự nghỉ dưỡng</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0 sm:min-w-[140px]">
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors">
              <span className="material-symbols-outlined text-[18px] mr-1">call</span> Gọi ngay
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-sm font-medium rounded-sm transition-colors">
              Xem hồ sơ
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <nav aria-label="Pagination" className="flex items-center space-x-1">
          <a className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-sm hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-not-allowed" href="#">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </a>
          <a className="px-3 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-sm font-medium text-sm" href="#">1</a>
          <a className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-sm hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors" href="#">2</a>
          <a className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-sm hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors" href="#">3</a>
          <span className="px-3 py-2 text-slate-500 dark:text-slate-400">...</span>
          <a className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-sm hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors" href="#">10</a>
          <a className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-sm hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors flex items-center" href="#">
            Tiếp theo <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
          </a>
        </nav>
      </div>
    </div>
  );
}
