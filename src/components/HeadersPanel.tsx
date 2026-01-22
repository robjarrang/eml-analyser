'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  
  const renderHeaderRow = (header: EmailHeader) => (
    <TableRow key={`${header.key}-${header.value.substring(0, 20)}`}>
      <TableCell className="font-mono text-xs font-medium text-primary w-1/4 align-top py-2">
        {header.key}
      </TableCell>
      <TableCell className="font-mono text-xs break-all py-2">
        <div className="flex items-start gap-2">
          <span className="flex-1">{header.value}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0"
            onClick={() => handleCopyHeader(header.key, header.value)}
          >
            {copiedHeader === header.key ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Headers
        </CardTitle>
        <CardDescription>
          {headers.length} headers found in this email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-96">
          <Accordion type="multiple" defaultValue={['important']} className="space-y-2">
            {/* Important Headers */}
            <AccordionItem value="important" className="border rounded-lg px-4">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/10">
                    {importantHeaders.length}
                  </Badge>
                  <span className="font-medium">Key Headers</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Header</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importantHeaders.map(renderHeaderRow)}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
            
            {/* Authentication Headers */}
            {authHeaders.length > 0 && (
              <AccordionItem value="auth" className="border rounded-lg px-4">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {authHeaders.length}
                    </Badge>
                    <span className="font-medium">Authentication Headers</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/4">Header</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authHeaders.map(renderHeaderRow)}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* Other Headers */}
            {otherHeaders.length > 0 && (
              <AccordionItem value="other" className="border rounded-lg px-4">
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {otherHeaders.length}
                    </Badge>
                    <span className="font-medium">Other Headers</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {showAllHeaders || otherHeaders.length <= 10 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/4">Header</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {otherHeaders.map(renderHeaderRow)}
                      </TableBody>
                    </Table>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/4">Header</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {otherHeaders.slice(0, 10).map(renderHeaderRow)}
                        </TableBody>
                      </Table>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllHeaders(true)}
                        className="w-full mt-2"
                      >
                        Show {otherHeaders.length - 10} more headers
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
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
        <ScrollArea className="max-h-96">
          <div className="space-y-0">
            {receivedChain.map((hop, index) => {
              const isFirst = index === receivedChain.length - 1;
              const isLast = index === 0;
              const delay = hop.delay !== undefined ? formatDelay(hop.delay) : null;
              
              return (
                <div key={index} className="relative">
                  {/* Connection line */}
                  {!isLast && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border" />
                  )}
                  
                  <div className="flex gap-3">
                    {/* Icon */}
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
                    
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="rounded-lg border p-3 bg-card">
                        {/* Server info */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="space-y-1">
                            {hop.by && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground font-medium">BY</span>
                                <span className="font-mono text-sm font-medium truncate max-w-xs">
                                  {hop.by}
                                </span>
                              </div>
                            )}
                            {hop.from && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground font-medium">FROM</span>
                                <span className="font-mono text-xs text-muted-foreground truncate max-w-xs">
                                  {hop.from}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
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
                  
                  {/* Labels */}
                  {(isFirst || isLast) && (
                    <div className="absolute -left-8 top-2">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          'text-xs -rotate-90 origin-right',
                          isFirst ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        )}
                      >
                        {isFirst ? 'Origin' : 'Delivered'}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
