'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-base)]">
      <div className="text-center max-w-md px-6">
        <p className="font-mono text-4xl font-semibold text-[var(--error)] mb-4">오류 발생</p>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="text-sm px-4 py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
