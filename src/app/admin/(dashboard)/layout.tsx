import AdminSidebar from "@/src/components/admin/AdminSidebar";
import AdminHeader from "@/src/components/admin/AdminHeader";
import { NotificationWrapper } from "@/src/components/layout/NotificationWrapper";
import { ProjectProvider } from "@/src/context/ProjectContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - finland.vn",
  description: "Quản trị hệ thống finland.vn",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#f6f8f7] text-slate-900">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto w-full">
          <ProjectProvider>
            {children}
          </ProjectProvider>
        </main>
        <NotificationWrapper />
      </div>
    </div>
  );
}

