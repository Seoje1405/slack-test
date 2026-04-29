import { SettingsForm } from '@/components/features/SettingsForm';

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 설정 페이지는 독자적인 레이아웃 (사이드바 없이 전체 너비) */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-10 px-6">
          <div className="mb-8">
            <a
              href="/dashboard"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              ← 대시보드로 돌아가기
            </a>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">설정</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            각 서비스의 API 토큰을 설정하여 피드를 활성화하세요.
          </p>
          <SettingsForm />
        </div>
      </div>
    </div>
  );
}
