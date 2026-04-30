import { Sidebar } from '@/components/layouts/Sidebar';
import { Topbar } from '@/components/layouts/Topbar';
import { BottomNav } from '@/components/layouts/BottomNav';
import { MeetingPanel } from '@/components/features/MeetingPanel';
import { NotionAddPanel } from '@/components/features/NotionAddPanel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        {/* 모바일에서 하단 탭바 높이만큼 padding */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-safe-nav md:pb-6">
          {children}
        </main>
      </div>
      <MeetingPanel />
      <NotionAddPanel />
      <BottomNav />
    </div>
  );
}
