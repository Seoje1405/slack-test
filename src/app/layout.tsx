import type { Metadata } from 'next';
import { JetBrains_Mono, DM_Sans } from 'next/font/google';
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

export const metadata: Metadata = {
  title: '팀 허브 대시보드',
  description: 'Notion, Discord, GitHub, Figma 변경사항을 한 화면에서',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${mono.variable} ${sans.variable} h-full`}>
      <body className="h-full bg-[var(--bg-base)] text-[var(--text-primary)] antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
