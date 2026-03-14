"use client";

import { ListingForm } from "../../../components/property/ListingForm";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TaoBaiDangPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Button & Header */}
        <div className="mb-8 flex flex-col gap-4">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors text-sm font-semibold w-fit"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Tạo bài đăng mới
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Vui lòng điền đầy đủ thông tin bên dưới để đăng tin bất động sản của bạn lên finland.vn
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-6 md:p-10">
          <ListingForm onSuccess={() => router.push("/")} />
        </div>
      </div>
    </div>
  );
}