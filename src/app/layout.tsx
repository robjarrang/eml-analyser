import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EML Analyzer - Email File Analysis Tool",
  description: "Analyze .eml email files securely in your browser. Check SPF, DKIM, DMARC authentication, view email headers, routing information, and preview content safely.",
  keywords: ["eml", "email", "analyzer", "spf", "dkim", "dmarc", "authentication", "headers", "privacy"],
  authors: [{ name: "EML Analyzer" }],
  openGraph: {
    title: "EML Analyzer - Email File Analysis Tool",
    description: "Analyze .eml email files securely in your browser. Check authentication, headers, and preview content safely.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <div className="relative flex min-h-screen flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container flex h-14 items-center px-4 max-w-7xl mx-auto">
              <div className="flex items-center gap-2">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-6 w-6 text-primary"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="font-semibold">EML Analyzer</span>
              </div>
              <div className="flex-1" />
              <nav className="flex items-center gap-4 text-sm">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-1">
            {children}
          </div>
          
          {/* Footer */}
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row px-4 max-w-7xl mx-auto">
              <p className="text-sm text-muted-foreground">
                100% client-side processing. Your data never leaves your browser.
              </p>
              <p className="text-sm text-muted-foreground">
                Built with Next.js and shadcn/ui
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
