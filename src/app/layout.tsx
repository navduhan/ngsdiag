import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme-provider';
import { AuthProvider } from '@/components/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import './globals.css';

export const metadata: Metadata = {
  title: 'NGSDiag - Metagenomic Analysis Pipeline',
  description: 'Web application for FASTQ upload, remote execution, and results browsing for metagenomic viral analysis. Developed by Naveen Duhan at SDSU ADRDL.',
  keywords: ['metagenomics', 'viral analysis', 'nextflow', 'bioinformatics', 'FASTQ', 'pipeline'],
  authors: [{ name: 'Naveen Duhan' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 ml-64">
                <Header />
                <main className="p-6">
                  {children}
                </main>
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
