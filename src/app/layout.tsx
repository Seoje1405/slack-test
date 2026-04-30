import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, DM_Sans } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
  title: '팀 허브 대시보드',
  description: 'Notion, Discord, GitHub, Figma 변경사항을 한 화면에서',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '팀허브',
  },
  icons: {
    apple: '/icons/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${mono.variable} ${sans.variable} h-full`}>
      <body className="h-full bg-[var(--bg-base)] text-[var(--text-primary)] antialiased font-sans">
        <Providers>{children}</Providers>
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
