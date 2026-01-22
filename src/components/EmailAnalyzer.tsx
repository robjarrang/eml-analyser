'use client';

import { useState, useCallback } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { MetadataPanel } from '@/components/MetadataPanel';
import { AuthenticationPanel } from '@/components/AuthenticationPanel';
import { EmailPreview } from '@/components/EmailPreview';
import { HeadersPanel, RoutingPanel } from '@/components/HeadersPanel';
import { AttachmentsPanel } from '@/components/AttachmentsPanel';
import { WarningsPanel } from '@/components/WarningsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RotateCcw, 
  Clock, 
  FileText,
  Shield,
  Mail,
  Route,
  Paperclip,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { parseEmlFile } from '@/lib/parser';
import type { EmailAnalysis } from '@/types/email';
import { cn } from '@/lib/utils';

export function EmailAnalyzer() {
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const handleFileAccepted = useCallback(async (content: ArrayBuffer, name: string) => {
    setIsProcessing(true);
    setError(null);
    setFilename(name);
    
    try {
      const result = await parseEmlFile(content);
      setAnalysis(result);
      setActiveTab('overview');
    } catch (err) {
      console.error('Parse error:', err);
      setError('Failed to parse the EML file. Please ensure it is a valid email file.');
      setAnalysis(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);
  
  const handleReset = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setFilename('');
    setActiveTab('overview');
  }, []);
  
  // Show file upload when no analysis
  if (!analysis) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-primary">
            EML File Analyzer
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Upload an .eml file to analyze email headers, authentication records, 
            routing information, and preview content—all processed securely in your browser.
          </p>
        </div>
        
        <FileDropzone
          onFileAccepted={handleFileAccepted}
          onError={handleError}
          isProcessing={isProcessing}
        />
        
        {error && (
          <Alert variant="destructive" className="mt-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Feature highlights - Jarrang card style */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl">
          <FeatureCard
            icon={Shield}
            title="Domain Authentication"
            description="SPF, DKIM, DMARC, and ARC verification analysis"
          />
          <FeatureCard
            icon={Route}
            title="Email Routing"
            description="Trace the path your email took through servers"
          />
          <FeatureCard
            icon={FileText}
            title="Safe Preview"
            description="View email content with sanitized HTML rendering"
          />
        </div>
      </div>
    );
  }
  
  // Show analysis results
  const { email, warnings, parseTime } = analysis;
  const hasErrors = warnings.some(w => w.severity === 'error');
  const hasWarnings = warnings.some(w => w.severity === 'warning');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            hasErrors ? 'bg-red-100 dark:bg-red-900/30' :
            hasWarnings ? 'bg-amber-100 dark:bg-amber-900/30' :
            'bg-green-100 dark:bg-green-900/30'
          )}>
            {hasErrors ? (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : hasWarnings ? (
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg truncate max-w-md" title={filename}>
              {filename}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              Analyzed in {parseTime.toFixed(0)}ms
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {email.attachments.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {email.attachments.length}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge 
                variant={hasErrors ? 'destructive' : hasWarnings ? 'secondary' : 'outline'}
                className={cn(
                  hasWarnings && !hasErrors && 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                )}
              >
                {warnings.length} finding{warnings.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>
      
      {/* Warnings at top if there are errors */}
      {hasErrors && <WarningsPanel warnings={warnings} />}
      
      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="headers" className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Headers</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5">
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetadataPanel email={email} />
            <div className="space-y-4">
              <AttachmentsPanel attachments={email.attachments} />
              {!hasErrors && warnings.length > 0 && (
                <WarningsPanel warnings={warnings} />
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AuthenticationPanel results={email.authentication} />
            <RoutingPanel receivedChain={email.receivedChain} />
          </div>
        </TabsContent>
        
        {/* Headers Tab */}
        <TabsContent value="headers" className="mt-4">
          <HeadersPanel headers={email.headers} />
        </TabsContent>
        
        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <div className="h-150">
            <EmailPreview 
              html={email.html}
              text={email.text}
              rawContent={email.rawContent}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 mb-4">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <h3 className="font-semibold text-base mb-2 text-primary">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
