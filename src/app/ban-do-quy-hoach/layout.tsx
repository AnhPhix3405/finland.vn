import { ProjectProvider } from "@/src/context/ProjectContext";
import { NotificationWrapper } from "@/src/components/layout/NotificationWrapper";

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="h-screen w-screen overflow-hidden bg-slate-950">
        <main className="h-full w-full">
          {children}
        </main>
        <NotificationWrapper />
      </div>
    </ProjectProvider>
  );
}
