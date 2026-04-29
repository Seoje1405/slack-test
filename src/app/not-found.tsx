import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-base)]">
      <div className="text-center">
        <p className="font-mono text-6xl font-semibold text-[var(--accent)] mb-4">404</p>
        <p className="text-[var(--text-secondary)] mb-6">페이지를 찾을 수 없습니다.</p>
        <Link
          href="/dashboard"
          className="text-sm text-[var(--accent-light)] hover:underline"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
