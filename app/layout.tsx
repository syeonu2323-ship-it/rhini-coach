// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'rhini-coach',
  description: 'Allergic rhinitis LFA analyzer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

