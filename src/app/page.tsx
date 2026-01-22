import { EmailAnalyzer } from '@/components/EmailAnalyzer';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <EmailAnalyzer />
      </div>
    </main>
  );
}
