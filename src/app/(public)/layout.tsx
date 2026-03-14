import Header from "@/src/components/layout/header";
import Footer from "@/src/components/layout/Footer";
import { ProjectProvider } from "@/src/context/ProjectContext";
import { NotificationWrapper } from "@/src/components/layout/NotificationWrapper";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProjectProvider>
      <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <NotificationWrapper />
        <Footer />
      </div>
    </ProjectProvider>
  );
}
