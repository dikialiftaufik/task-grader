import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskGrader — Sistem Penilaian Praktikum Berbasis AI',
  description:
    'Sistem penilaian otomatis untuk praktikum Pemrograman Berorientasi Objek menggunakan AI Gemini 2.0 Flash. Transparan, akurat, dan efisien.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              border: '3px solid #111111',
              boxShadow: '5px 5px 0px #111111',
              borderRadius: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
            },
            success: {
              style: {
                background: '#00C48C',
                color: '#FFFFFF',
              },
            },
            error: {
              style: {
                background: '#FF3B3B',
                color: '#FFFFFF',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
