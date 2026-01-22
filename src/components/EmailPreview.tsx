'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Code, FileText, AlertTriangle, ExternalLink, Shield, Copy, Check } from 'lucide-react';
import { sanitizeHtml, analyzeContentSafety } from '@/lib/sanitizer';
import { cn } from '@/lib/utils';

interface EmailPreviewProps {
  html?: string;
  text?: string;
  rawContent: string;
}

export function EmailPreview({ html, text, rawContent }: EmailPreviewProps) {
  const [activeTab, setActiveTab] = useState<string>(html ? 'html' : text ? 'text' : 'raw');
  const [copiedRaw, setCopiedRaw] = useState(false);
  
  // Sanitize HTML and analyze for safety
  const { sanitizedHtml, safetyAnalysis } = useMemo(() => {
    if (!html) return { sanitizedHtml: '', safetyAnalysis: null };
    
    const sanitized = sanitizeHtml(html);
    const analysis = analyzeContentSafety(html);
    
    return { sanitizedHtml: sanitized, safetyAnalysis: analysis };
  }, [html]);
  
  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  };
  
  const hasWarnings = safetyAnalysis && (
    safetyAnalysis.hasExternalImages || 
    safetyAnalysis.hasTrackingPixels
  );
  
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg">Email Content</CardTitle>
            <CardDescription>
              Preview of the email body and raw source
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {html && <Badge variant="outline"><Code className="w-3 h-3 mr-1" />HTML</Badge>}
            {text && <Badge variant="outline"><FileText className="w-3 h-3 mr-1" />Text</Badge>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="html" disabled={!html} className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
            <TabsTrigger value="text" disabled={!text} className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plain Text</span>
            </TabsTrigger>
            <TabsTrigger value="raw" className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Raw Source</span>
            </TabsTrigger>
          </TabsList>
          
          {/* HTML Preview Tab */}
          <TabsContent value="html" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            {html ? (
              <div className="flex flex-col h-full gap-3">
                {/* Security Warnings */}
                {hasWarnings && (
                  <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">Content Security Notice</AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {safetyAnalysis?.hasExternalImages && (
                          <li>External images have been blocked for your privacy</li>
                        )}
                        {safetyAnalysis?.hasTrackingPixels && (
                          <li className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 inline" />
                            Potential tracking pixels detected
                          </li>
                        )}
                      </ul>
                      {safetyAnalysis?.externalDomains && safetyAnalysis.externalDomains.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium">
                            View blocked domains ({safetyAnalysis.externalDomains.length})
                          </summary>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {safetyAnalysis.externalDomains.slice(0, 10).map((domain) => (
                              <Badge key={domain} variant="secondary" className="text-xs font-mono">
                                <ExternalLink className="w-2.5 h-2.5 mr-1" />
                                {domain}
                              </Badge>
                            ))}
                            {safetyAnalysis.externalDomains.length > 10 && (
                              <Badge variant="secondary" className="text-xs">
                                +{safetyAnalysis.externalDomains.length - 10} more
                              </Badge>
                            )}
                          </div>
                        </details>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Sandboxed HTML Preview */}
                <ScrollArea className="flex-1 rounded-md border bg-white">
                  <div 
                    className="p-4 prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                </ScrollArea>
              </div>
            ) : (
              <EmptyState message="No HTML content in this email" />
            )}
          </TabsContent>
          
          {/* Plain Text Tab */}
          <TabsContent value="text" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            {text ? (
              <ScrollArea className="h-full rounded-md border bg-muted/30">
                <pre className="p-4 text-sm whitespace-pre-wrap font-mono text-foreground">
                  {text}
                </pre>
              </ScrollArea>
            ) : (
              <EmptyState message="No plain text content in this email" />
            )}
          </TabsContent>
          
          {/* Raw Source Tab */}
          <TabsContent value="raw" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <div className="flex flex-col h-full gap-2">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRaw}
                  className="gap-1.5"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Source
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="flex-1 rounded-md border bg-muted/30">
                <pre className="p-4 text-xs whitespace-pre-wrap font-mono text-muted-foreground break-all">
                  {rawContent}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={cn(
      'h-full flex flex-col items-center justify-center',
      'text-muted-foreground text-center p-8',
      'border rounded-md bg-muted/20'
    )}>
      <FileText className="w-12 h-12 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
