'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Server, 
  ArrowDown, 
  AlertTriangle, 
  Copy, 
  Check,
  ChevronRight,
  Mail,
  Globe
} from 'lucide-react';
import type { ReceivedHop, EmailHeader } from '@/types/email';
import { format, formatDistanceStrict } from 'date-fns';
import { cn } from '@/lib/utils';

interface HeadersPanelProps {
  headers: EmailHeader[];
}

interface RoutingPanelProps {
  receivedChain: ReceivedHop[];
}

// Common headers that users typically care about, in display order
const IMPORTANT_HEADERS = [
  'from',
  'to',
  'cc',
  'bcc',
  'reply-to',
  'subject',
  'date',
  'message-id',
  'return-path',
  'content-type',
  'mime-version',
  'x-mailer',
  'x-originating-ip',
  'x-priority',
  'importance',
  'list-unsubscribe',
];

const AUTHENTICATION_HEADERS = [
  'authentication-results',
  'received-spf',
  'dkim-signature',
  'arc-seal',
  'arc-message-signature',
  'arc-authentication-results',
];

export function HeadersPanel({ headers }: HeadersPanelProps) {
  const [copiedHeader, setCopiedHeader] = useState<string | null>(null);
  const [showAllHeaders, setShowAllHeaders] = useState(false);
  
  const { importantHeaders, authHeaders, otherHeaders } = useMemo(() => {
    const important: EmailHeader[] = [];
    const auth: EmailHeader[] = [];
    const other: EmailHeader[] = [];
    
    for (const header of headers) {
      const keyLower = header.key.toLowerCase();
      
      if (IMPORTANT_HEADERS.includes(keyLower)) {
        important.push(header);
      } else if (AUTHENTICATION_HEADERS.includes(keyLower)) {
        auth.push(header);
      } else if (keyLower !== 'received') {
        // Exclude Received headers as they're shown in Routing panel
        other.push(header);
      }
    }
    
    // Sort important headers by defined order
    important.sort((a, b) => {
      const aIndex = IMPORTANT_HEADERS.indexOf(a.key.toLowerCase());
      const bIndex = IMPORTANT_HEADERS.indexOf(b.key.toLowerCase());
      return aIndex - bIndex;
    });
    
    return { importantHeaders: important, authHeaders: auth, otherHeaders: other };
  }, [headers]);
  
  const handleCopyHeader = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(`${key}: ${value}`);
      setCopiedHeader(key);
      setTimeout(() => setCopiedHeader(null), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };
  
  return (
    <Card className="overflow-visible">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Headers
        </CardTitle>
        <CardDescription>
          {headers.length} headers found in this email
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <Accordion type="multiple" defaultValue={['important']} className="space-y-2">
          {/* Important Headers */}
          <AccordionItem value="important" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/10">
                  {importantHeaders.length}
                </Badge>
                <span className="font-medium">Key Headers</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="px-4 pb-4">
                <div className="rounded border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left font-medium px-3 py-2 w-36 border-b">Header</th>
                        <th className="text-left font-medium px-3 py-2 border-b">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importantHeaders.map((header, idx) => (
                        <HeaderRow key={`${header.key}-${idx}`} header={header} onCopy={handleCopyHeader} copiedHeader={copiedHeader} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Authentication Headers */}
          {authHeaders.length > 0 && (
            <AccordionItem value="auth" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {authHeaders.length}
                  </Badge>
                  <span className="font-medium">Authentication Headers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 pb-4">
                  <div className="rounded border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left font-medium px-3 py-2 w-36 border-b">Header</th>
                          <th className="text-left font-medium px-3 py-2 border-b">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {authHeaders.map((header, idx) => (
                          <HeaderRow key={`${header.key}-${idx}`} header={header} onCopy={handleCopyHeader} copiedHeader={copiedHeader} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Other Headers */}
          {otherHeaders.length > 0 && (
            <AccordionItem value="other" className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {otherHeaders.length}
                  </Badge>
                  <span className="font-medium">Other Headers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 pb-4">
                  <div className="rounded border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left font-medium px-3 py-2 w-36 border-b">Header</th>
                          <th className="text-left font-medium px-3 py-2 border-b">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(showAllHeaders ? otherHeaders : otherHeaders.slice(0, 10)).map((header, idx) => (
                          <HeaderRow key={`${header.key}-${idx}`} header={header} onCopy={handleCopyHeader} copiedHeader={copiedHeader} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!showAllHeaders && otherHeaders.length > 10 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllHeaders(true)}
                      className="w-full mt-3"
                    >
                      Show {otherHeaders.length - 10} more headers
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Extracted HeaderRow component for cleaner code
function HeaderRow({ header, onCopy, copiedHeader }: { 
  header: EmailHeader; 
  onCopy: (key: string, value: string) => void;
  copiedHeader: string | null;
}) {
  return (
    <tr className="group">
      <td className="px-3 py-2 align-top">
        <code className="text-xs font-medium text-primary break-all">{header.key}</code>
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-start gap-2">
          <code className="text-xs text-muted-foreground break-all flex-1 whitespace-pre-wrap">{header.value}</code>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onCopy(header.key, header.value)}
          >
            {copiedHeader === header.key ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function formatDelay(ms: number): { text: string; isLong: boolean } {
  const seconds = ms / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  
  if (seconds < 0) {
    return { text: 'time skew', isLong: false };
  } else if (seconds < 1) {
    return { text: '<1 sec', isLong: false };
  } else if (seconds < 60) {
    return { text: `${Math.round(seconds)} sec`, isLong: seconds > 30 };
  } else if (minutes < 60) {
    return { text: `${Math.round(minutes)} min`, isLong: minutes > 5 };
  } else {
    return { text: `${hours.toFixed(1)} hrs`, isLong: true };
  }
}

export function RoutingPanel({ receivedChain }: RoutingPanelProps) {
  const totalTime = useMemo(() => {
    if (receivedChain.length < 2) return null;
    
    const first = receivedChain[receivedChain.length - 1];
    const last = receivedChain[0];
    
    if (first.timestamp && last.timestamp) {
      const diff = last.timestamp.getTime() - first.timestamp.getTime();
      return diff > 0 ? formatDistanceStrict(first.timestamp, last.timestamp) : null;
    }
    return null;
  }, [receivedChain]);
  
  if (receivedChain.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Email Routing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No routing information found in this email.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Email Routing
            </CardTitle>
            <CardDescription>
              {receivedChain.length} hop{receivedChain.length !== 1 ? 's' : ''} through mail servers
            </CardDescription>
          </div>
          {totalTime && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Total: {totalTime}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-125">
          <div className="space-y-0 pl-2 pr-2 pb-2">
            {receivedChain.map((hop, index) => {
              const isFirst = index === receivedChain.length - 1;
              const isLast = index === 0;
              const delay = hop.delay !== undefined ? formatDelay(hop.delay) : null;
              
              return (
                <div key={index} className={cn("relative", isFirst && "pb-2")}>
                  {/* Connection line */}
                  {!isLast && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  <div className="flex gap-3">
                    {/* Icon with integrated label */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2',
                        isFirst ? 'bg-green-100 border-green-500 dark:bg-green-950 dark:border-green-600' :
                        isLast ? 'bg-blue-100 border-blue-500 dark:bg-blue-950 dark:border-blue-600' :
                        'bg-background border-muted-foreground/30'
                      )}>
                        <Server className={cn(
                          'w-4 h-4',
                          isFirst ? 'text-green-600 dark:text-green-400' :
                          isLast ? 'text-blue-600 dark:text-blue-400' :
                          'text-muted-foreground'
                        )} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      {/* Origin/Delivered label above the card */}
                      {(isFirst || isLast) && (
                        <div className="mb-1.5">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              'text-xs font-medium',
                              isFirst ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            )}
                          >
                            {isFirst ? '📤 Origin Server' : '📥 Delivered'}
                          </Badge>
                        </div>
                      )}
                      
                      <div className={cn(
                        'rounded-lg border p-3 bg-card',
                        isFirst && 'border-green-200 dark:border-green-800',
                        isLast && 'border-blue-200 dark:border-blue-800'
                      )}>
                        {/* Server info */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="space-y-1 min-w-0 flex-1">
                            {hop.by && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground font-medium shrink-0">BY</span>
                                <span className="font-mono text-sm font-medium truncate">
                                  {hop.by}
                                </span>
                              </div>
                            )}
                            {hop.from && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground font-medium shrink-0">FROM</span>
                                <span className="font-mono text-xs text-muted-foreground truncate">
                                  {hop.from}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {hop.timestamp && (
                              <time className="text-xs text-muted-foreground">
                                {format(hop.timestamp, 'MMM d, yyyy HH:mm:ss')}
                              </time>
                            )}
                            {hop.with && (
                              <Badge variant="outline" className="text-xs">
                                {hop.with}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delay indicator */}
                      {delay && !isLast && (
                        <div className="flex items-center gap-2 mt-2 ml-2">
                          <ArrowDown className="w-3 h-3 text-muted-foreground" />
                          <span className={cn(
                            'text-xs font-medium',
                            delay.isLong ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                          )}>
                            {delay.text}
                            {delay.isLong && (
                              <AlertTriangle className="w-3 h-3 inline ml-1" />
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
