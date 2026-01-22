'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, AlertTriangle, MinusCircle, HelpCircle, Shield, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import type { AuthenticationResult } from '@/types/email';
import { cn } from '@/lib/utils';

interface AuthenticationPanelProps {
  results: AuthenticationResult[];
}

const methodLabels: Record<string, string> = {
  spf: 'SPF (Sender Policy Framework)',
  dkim: 'DKIM (DomainKeys Identified Mail)',
  dmarc: 'DMARC (Domain-based Message Authentication)',
  arc: 'ARC (Authenticated Received Chain)',
};

const methodDescriptions: Record<string, string> = {
  spf: 'Verifies that the sending server is authorized to send email for the domain.',
  dkim: 'Cryptographically verifies the email has not been tampered with and comes from the claimed domain.',
  dmarc: 'Combines SPF and DKIM to provide domain-level authentication and reporting.',
  arc: 'Preserves authentication results across forwarding services.',
};

const resultConfig: Record<string, { 
  icon: typeof CheckCircle; 
  color: string; 
  bgColor: string; 
  label: string;
  description: string;
}> = {
  pass: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800',
    label: 'Pass',
    description: 'Authentication check passed successfully.',
  },
  fail: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
    label: 'Fail',
    description: 'Authentication check failed. This could indicate spoofing or misconfiguration.',
  },
  softfail: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    label: 'Soft Fail',
    description: 'Authentication check did not pass but is not a definitive failure.',
  },
  neutral: {
    icon: MinusCircle,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
    label: 'Neutral',
    description: 'The domain does not assert whether the sender is authorized.',
  },
  none: {
    icon: MinusCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
    label: 'None',
    description: 'No authentication record found for this check.',
  },
  temperror: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800',
    label: 'Temp Error',
    description: 'A temporary error occurred during authentication check.',
  },
  permerror: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800',
    label: 'Perm Error',
    description: 'A permanent error in the authentication configuration.',
  },
  unknown: {
    icon: HelpCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
    label: 'Unknown',
    description: 'Unable to determine authentication status.',
  },
};

function getOverallStatus(results: AuthenticationResult[]): 'pass' | 'fail' | 'partial' | 'unknown' {
  if (results.length === 0) return 'unknown';
  
  const hasPass = results.some(r => r.result === 'pass');
  const hasFail = results.some(r => r.result === 'fail' || r.result === 'permerror');
  const hasSoftfail = results.some(r => r.result === 'softfail');
  
  if (hasFail) return 'fail';
  if (hasSoftfail && !hasPass) return 'partial';
  if (hasPass) return hasSoftfail ? 'partial' : 'pass';
  return 'unknown';
}

function OverallStatusBadge({ status }: { status: 'pass' | 'fail' | 'partial' | 'unknown' }) {
  const config = {
    pass: {
      icon: ShieldCheck,
      label: 'Authenticated',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    },
    fail: {
      icon: ShieldX,
      label: 'Authentication Failed',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    },
    partial: {
      icon: ShieldAlert,
      label: 'Partial Authentication',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    },
    unknown: {
      icon: Shield,
      label: 'Unknown Status',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    },
  };
  
  const { icon: Icon, label, className } = config[status];
  
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', className)}>
      <Icon className="w-4 h-4" />
      {label}
    </div>
  );
}

function AuthResultCard({ result }: { result: AuthenticationResult }) {
  const config = resultConfig[result.result] || resultConfig.unknown;
  const Icon = config.icon;
  const methodLabel = methodLabels[result.method] || result.method.toUpperCase();
  const methodDesc = methodDescriptions[result.method] || '';
  
  return (
    <AccordionItem value={`${result.method}-${result.domain || 'unknown'}`} className="border-0">
      <div className={cn('rounded-lg border transition-colors', config.bgColor)}>
        <AccordionTrigger className="px-4 py-3 hover:no-underline data-[state=open]:rounded-b-none">
          <div className="flex items-center gap-3 w-full">
            <Icon className={cn('w-5 h-5 shrink-0', config.color)} />
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">{result.method.toUpperCase()}</div>
              {result.domain && (
                <div className="text-xs text-muted-foreground truncate">{result.domain}</div>
              )}
            </div>
            <Badge variant="secondary" className={cn('ml-auto', config.color)}>
              {config.label}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3 pt-2">
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                What is {result.method.toUpperCase()}?
              </h4>
              <p className="text-sm">{methodDesc}</p>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                Result
              </h4>
              <p className="text-sm">{config.description}</p>
            </div>
            
            {result.details && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Details
                </h4>
                <p className="text-sm font-mono bg-muted/50 rounded px-2 py-1 break-all">
                  {result.details}
                </p>
              </div>
            )}
            
            {result.selector && (
              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                  DKIM Selector
                </h4>
                <p className="text-sm font-mono">{result.selector}</p>
              </div>
            )}
          </div>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
}

export function AuthenticationPanel({ results }: AuthenticationPanelProps) {
  const overallStatus = getOverallStatus(results);
  
  // Group results by method
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.method]) {
      acc[result.method] = [];
    }
    acc[result.method].push(result);
    return acc;
  }, {} as Record<string, AuthenticationResult[]>);
  
  const methodOrder = ['spf', 'dkim', 'dmarc', 'arc'];
  const sortedMethods = Object.keys(groupedResults).sort((a, b) => {
    const aIndex = methodOrder.indexOf(a);
    const bIndex = methodOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg">Domain Authentication</CardTitle>
            <CardDescription>
              SPF, DKIM, DMARC, and ARC verification results
            </CardDescription>
          </div>
          <OverallStatusBadge status={overallStatus} />
        </div>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No authentication headers found in this email.</p>
            <p className="text-xs mt-1">This email may not have been authenticated by the sending server.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-100">
            <Accordion type="multiple" className="space-y-2">
              {sortedMethods.map((method) => (
                groupedResults[method].map((result, index) => (
                  <AuthResultCard 
                    key={`${result.method}-${result.domain || index}`} 
                    result={result} 
                  />
                ))
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
