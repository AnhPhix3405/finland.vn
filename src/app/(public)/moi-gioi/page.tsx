import { Metadata } from "next";
import Link from "next/link";
import { Phone, MapPin, FileText } from "lucide-react";
import { prisma } from "@/src/lib/prisma";

export const metadata: Metadata = {
  title: "Danh Sách Môi Giới - finland.vn",
};

async function getBrokers() {
  try {
    const brokers = await prisma.brokers.findMany({
      where: { is_active: true },
      select: {
        id: true,
        full_name: true,
        avatar_url: true,
        bio: true,
        province: true,
        ward: true,
        address: true,
        phone: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return brokers as {
      id: string;
      full_name: string;
      avatar_url: string | null;
      bio: string | null;
      province: string | null;
      ward: string | null;
      address: string | null;
      phone: string;
    }[];
  } catch (error) {
    console.error("Error fetching brokers:", error);
    return [];
  }
}

export default async function BrokerList() {
  const brokers = await getBrokers();

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

      <div className="space-y-4">
        {brokers.map((broker) => (
          <div key={broker.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 rounded-sm shadow-sm flex flex-col sm:flex-row gap-4 hover:border-emerald-500 transition-colors group">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img 
                alt={broker.full_name} 
                className="w-24 h-24 object-cover border border-slate-200 dark:border-slate-600 rounded-sm" 
                src={broker.avatar_url || "/imgs/no-avatar.jpg"}
              />
            </div>
            
            {/* Info */}
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  {broker.full_name}
                </h2>
                {broker.bio && (
                  <div className="flex items-start gap-2 mt-2">
                    <FileText className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {broker.bio}
                    </p>
                  </div>
                )}
                {(broker.address || broker.ward || broker.province) && (
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {broker.address && <span>{broker.address}, </span>}
                      {broker.ward && <span>{broker.ward}, </span>}
                      {broker.province}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex-shrink-0 flex sm:flex-col justify-end gap-2 mt-4 sm:mt-0 sm:min-w-[160px]">
              <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-sm transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                {broker.phone}
              </button>
              <a 
                href={`https://zalo.me/${broker.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-[#0068FF] hover:bg-[#0052CC] text-white text-sm font-medium rounded-sm transition-colors"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.098.547 4.078 1.52 5.78L0 24l6.22-1.52A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.38 0 9.818 4.438 9.818 9.818 0 2.098-.547 4.078-1.52 5.78L12 22l-5.298-1.22A11.944 11.944 0 012.182 12c0-5.38 4.438-9.818 9.818-9.818z"/>
                  <path d="M17.5 14c-1.42 0-2.732.546-3.734 1.464l-1.042-1.042a.545.545 0 00-.768 0l-1.456 1.456a.545.545 0 01-.768 0l-1.042-1.042a.545.545 0 00-.768 0l-.52.52a.545.545 0 01-.768 0l-1.04-1.04a.545.545 0 00-.768 0L3.5 14.5c-.3.3-.3.786 0 1.086l1.04 1.04c.3.3.786.3 1.086 0l.52-.52c.3-.3.786-.3 1.086 0l1.04 1.04c.3.3.786.3 1.086 0l1.042-1.042c.3-.3.786-.3 1.086 0l1.456 1.456c.3.3.786.3 1.086 0l1.042-1.042c.3-.3.3-.786 0-1.086l-.52-.52c-.3-.3-.3-.786 0-1.086l1.04-1.04c.3-.3.3-.786 0-1.086l-.52-.52c-.3-.3-.3-.786 0-1.086z"/>
                </svg>
                Zalo
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
