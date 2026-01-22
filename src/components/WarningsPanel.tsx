'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import type { AnalysisWarning } from '@/types/email';
import { cn } from '@/lib/utils';

interface WarningsPanelProps {
  warnings: AnalysisWarning[];
}

const severityConfig = {
  error: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    badgeVariant: 'destructive' as const,
    label: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    badgeVariant: 'secondary' as const,
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    badgeVariant: 'outline' as const,
    label: 'Info',
  },
};

export function WarningsPanel({ warnings }: WarningsPanelProps) {
  if (warnings.length === 0) {
    return null;
  }
  
  const errorCount = warnings.filter(w => w.severity === 'error').length;
  const warningCount = warnings.filter(w => w.severity === 'warning').length;
  const infoCount = warnings.filter(w => w.severity === 'info').length;
  
  // Sort warnings by severity (errors first, then warnings, then info)
  const sortedWarnings = [...warnings].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
  
  return (
    <Card className={cn(
      errorCount > 0 
        ? 'border-red-200 dark:border-red-800' 
        : warningCount > 0 
          ? 'border-amber-200 dark:border-amber-800'
          : ''
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Analysis Findings
            </CardTitle>
            <CardDescription>
              Issues and notes from the email analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <Badge variant="destructive">
                {errorCount} error{errorCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="outline">
                {infoCount} note{infoCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-64">
          <div className="space-y-3">
            {sortedWarnings.map((warning, index) => {
              const config = severityConfig[warning.severity];
              const Icon = config.icon;
              
              return (
                <Alert 
                  key={`${warning.title}-${index}`}
                  variant="default"
                  className={cn('transition-colors', config.bgColor)}
                >
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <AlertTitle className="flex items-center gap-2">
                    {warning.title}
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {config.label}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-1 text-sm">
                    {warning.description}
                  </AlertDescription>
                </Alert>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
