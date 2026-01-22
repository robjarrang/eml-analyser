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
          {/* Header - Jarrang style dark header */}
          <header className="sticky top-0 z-50 w-full bg-primary text-primary-foreground">
            <div className="container flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
              <a href="https://www.jarrang.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 40 40" className="h-8 w-8" fill="none">
                  <rect width="40" height="40" rx="8" className="fill-accent" />
                  <path d="M12 14h16M12 20h16M12 26h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight">Jarrang</span>
                  <span className="text-xs text-primary-foreground/70 leading-tight">EML Analyzer</span>
                </div>
              </a>
              <nav className="flex items-center gap-6 text-sm">
                <a 
                  href="https://www.jarrang.com/services" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Services
                </a>
                <a 
                  href="https://www.jarrang.com/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Contact
                </a>
              </nav>
            </div>
          </header>
          
          {/* Main content */}
          <div className="flex-1 bg-secondary/30">
            {children}
          </div>
          
          {/* Footer - Jarrang style */}
          <footer className="bg-primary text-primary-foreground py-8">
            <div className="container px-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <a href="https://www.jarrang.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-accent transition-colors">
                    Jarrang
                  </a>
                  <span className="text-primary-foreground/60 text-sm">
                    Leading Email Marketing & CRM Agency
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-primary-foreground/70">
                  <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    100% client-side processing
                  </span>
                  <span className="text-primary-foreground/40">•</span>
                  <span>Your data never leaves your browser</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
