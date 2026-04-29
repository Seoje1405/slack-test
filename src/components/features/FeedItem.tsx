'use client';

import { timeAgo } from '@/lib/utils';
import { useFeedAnnotationStore } from '@/stores/feedAnnotationStore';
import { SERVICE_MAP } from '@/config/services';
import type { FeedItem as FeedItemType } from '@/types/feed';

interface FeedItemProps {
  item: FeedItemType;
  accentColor: string;
  showServiceBadge?: boolean;
}

export function FeedItem({ item, accentColor, showServiceBadge = false }: FeedItemProps) {
  const isFav = useFeedAnnotationStore((s) => !!s.favorites[item.id]);
  const toggleFavorite = useFeedAnnotationStore((s) => s.toggleFavorite);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return;
    if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  const serviceConfig = SERVICE_MAP[item.service];

  return (
    <div className="group px-4 py-2">
      <div
        className={`flex items-start gap-3 rounded-lg px-2 py-2 transition-colors cursor-pointer hover:bg-[var(--bg-overlay)] ${isFav ? 'bg-[var(--bg-overlay)]' : ''}`}
        onClick={handleClick}
        role={item.url ? 'link' : undefined}
        tabIndex={item.url ? 0 : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !(e.target as HTMLElement).closest('[data-action]'))
            handleClick(e as unknown as React.MouseEvent);
        }}
      >
        {/* 아바타 */}
        <div className="flex-shrink-0 mt-0.5 relative">
          {item.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatarUrl} alt={item.user} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold"
              style={{ background: `${accentColor}30`, color: accentColor }}
            >
              {item.user.charAt(0).toUpperCase()}
            </div>
          )}
          {showServiceBadge && (
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-[var(--bg-elevated)] flex items-center justify-center"
              style={{ background: serviceConfig.color }}
              title={serviceConfig.label}
            />
          )}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)] leading-snug truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--text-muted)]">{item.user}</span>
            {showServiceBadge && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ color: serviceConfig.color, background: `${serviceConfig.color}18` }}
              >
                {serviceConfig.label}
              </span>
            )}
            {item.tag && !showServiceBadge && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ color: accentColor, background: `${accentColor}18` }}
              >
                {item.tag}
              </span>
            )}
            {item.tag && showServiceBadge && (
              <span className="text-xs text-[var(--text-muted)]">{item.tag}</span>
            )}
          </div>
        </div>

        {/* 즐겨찾기 버튼 */}
        <div
          className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
          data-action
        >
          <button
            data-action
            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
            className="p-1 rounded transition-colors hover:bg-[var(--bg-elevated)]"
            title={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
          >
            <StarIcon filled={isFav} color={accentColor} />
          </button>
        </div>

        {/* 시간 */}
        <span className="flex-shrink-0 text-xs text-[var(--text-muted)] font-mono mt-0.5 group-hover:hidden">
          {timeAgo(item.time)}
        </span>
      </div>
    </div>
  );
}

function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={filled ? color : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function FeedItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-6 py-3">
      <div className="w-7 h-7 rounded-full skeleton-shimmer flex-shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-1/3 rounded skeleton-shimmer" />
      </div>
      <div className="h-3 w-12 rounded skeleton-shimmer flex-shrink-0 mt-0.5" />
    </div>
  );
}
