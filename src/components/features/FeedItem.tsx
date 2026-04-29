import { timeAgo } from '@/lib/utils';
import type { FeedItem as FeedItemType } from '@/types/feed';

interface FeedItemProps {
  item: FeedItemType;
  accentColor: string;
}

export function FeedItem({ item, accentColor }: FeedItemProps) {
  const handleClick = () => {
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer hover:bg-[var(--bg-overlay)] transition-colors"
      onClick={handleClick}
      role={item.url ? 'link' : undefined}
      tabIndex={item.url ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* 아바타 */}
      <div className="flex-shrink-0 mt-0.5">
        {item.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.avatarUrl}
            alt={item.user}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold"
            style={{ background: `${accentColor}30`, color: accentColor }}
          >
            {item.user.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] leading-snug truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[var(--text-muted)]">{item.user}</span>
          {item.tag && (
            <span
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ color: accentColor, background: `${accentColor}18` }}
            >
              {item.tag}
            </span>
          )}
        </div>
      </div>

      {/* 시간 */}
      <span className="flex-shrink-0 text-xs text-[var(--text-muted)] font-mono mt-0.5">
        {timeAgo(item.time)}
      </span>
    </div>
  );
}

export function FeedItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full skeleton-shimmer flex-shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-1/3 rounded skeleton-shimmer" />
      </div>
      <div className="h-3 w-12 rounded skeleton-shimmer flex-shrink-0 mt-0.5" />
    </div>
  );
}
