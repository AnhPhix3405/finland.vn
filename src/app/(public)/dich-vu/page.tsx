import { Megaphone, Bell, Info } from "lucide-react";
import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section */}
      <section className="bg-emerald-600 dark:bg-emerald-900 py-16 sm:py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-6 backdrop-blur-md">
            <Megaphone className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 tracking-tight">Dịch vụ & Thông báo</h1>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
            Cập nhật những thông tin mới nhất và các dịch vụ hỗ trợ từ Ban Quản Trị finland.vn
          </p>
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bell className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">📢 Thông báo từ Ban Quản Trị</h2>
            </div>
            
            <div className="space-y-6 text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Kính gửi quý khách hàng và người dùng,</p>
              
              <p>
                Nhằm nâng cao chất lượng trải nghiệm trên hệ thống tra cứu, mua bán và cho thuê bất động sản, chúng tôi đang tiến hành cập nhật dữ liệu và cải thiện một số tính năng trên nền tảng.
              </p>
              
              <p>
                Trong thời gian này, một số thông tin về bất động sản, giá cả, quy hoạch hoặc trạng thái giao dịch có thể được điều chỉnh để đảm bảo tính chính xác và minh bạch.
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-6 rounded-r-xl my-8">
                <div className="flex gap-4">
                  <Info className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    Quý khách vui lòng kiểm tra kỹ thông tin trước khi thực hiện giao dịch, đồng thời liên hệ với bộ phận hỗ trợ nếu cần xác minh thêm về pháp lý, vị trí hoặc tình trạng tài sản.
                  </p>
                </div>
              </div>
              
              <p>
                Xin cảm ơn quý khách đã tin tưởng và đồng hành cùng hệ thống.
              </p>
              
              <div className="pt-10 border-t border-slate-100 dark:border-slate-800 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                    BQT
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Ban Quản Trị</p>
                    <p className="text-sm text-slate-500">finland.vn</p>
                  </div>
                </div>
                
                <Link 
                  href="/ho-tro"
                  className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform"
                >
                  Liên hệ hỗ trợ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
