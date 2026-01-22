import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EML Analyzer | Jarrang",
  description: "Analyze .eml email files securely in your browser. Check SPF, DKIM, DMARC authentication, view email headers, routing information, and preview content safely.",
  keywords: ["eml", "email", "analyzer", "spf", "dkim", "dmarc", "authentication", "headers", "privacy", "jarrang"],
  authors: [{ name: "Jarrang" }],
  openGraph: {
    title: "EML Analyzer | Jarrang",
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
      <body className={`${inter.variable} antialiased font-sans`}>
        <div className="relative flex min-h-screen flex-col">
          {/* Header - Jarrang style */}
          <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground">
            <div className="container flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
                  <rect width="32" height="32" rx="6" className="fill-accent" />
                  <path d="M9 11h14M9 16h14M9 21h9" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="font-semibold text-lg">EML Analyzer</span>
              </div>
              <div className="text-sm text-primary-foreground/70">
                Internal Tool
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-1 bg-background">
            {children}
          </div>
          
          {/* Footer - Jarrang style */}
          <footer className="bg-primary text-primary-foreground py-6">
            <div className="container px-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-primary-foreground/70">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                  <span>100% client-side processing — Your data never leaves your browser</span>
                </div>
                <div className="text-primary-foreground/50">
                  Jarrang Internal Tool
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
