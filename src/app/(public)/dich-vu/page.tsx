'use client';

import { Megaphone, Bell, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function ServicesPage() {
  const [data, setData] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch(err => console.error('Error fetching services:', err))
      .finally(() => setLoading(false));
  }, []);

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
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-slate-500 font-medium tracking-wide">Đang tải thông báo...</p>
            </div>
          ) : data ? (
            <div className="p-8 sm:p-12">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{data.title}</h2>
              </div>

              <div className="markdown-content text-slate-600 dark:text-slate-300 leading-relaxed text-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ ...props }) => (
                      <img {...props} src={props.src || undefined} className="rounded-xl shadow-lg my-8 mx-auto" />
                    ),
                    a: ({ ...props }) => (
                      <a {...props} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline underline-offset-4" />
                    )
                  }}
                >
                  {data.content}
                </ReactMarkdown>

                <div className="pt-10 border-t border-slate-100 dark:border-slate-800 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 ring-2 ring-emerald-500/20">
                      BQT
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Ban Quản Trị</p>
                      <p className="text-sm text-slate-500 font-medium">finland.vn</p>
                    </div>
                  </div>

                  <Link
                    href="#"
                    className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                  >
                    Liên hệ hỗ trợ
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-center">
              <Info className="w-12 h-12 text-slate-300" />
              <p className="text-slate-500 text-lg">Hiện chưa có thông báo mới nào từ hệ thống.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
