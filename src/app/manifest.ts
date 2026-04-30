import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '팀 허브 대시보드',
    short_name: '팀허브',
    description: 'Notion, Discord, GitHub, Figma 변경사항을 한 화면에서',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      // PNG 아이콘은 public/icons/icon-192.png, icon-512.png 파일 추가 후 활성화
      // { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      // { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
