'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Calendar, 
  User, 
  Users, 
  Reply, 
  Hash,
  ArrowLeftRight,
  Clock
} from 'lucide-react';
import type { EmailAddress, ParsedEmail } from '@/types/email';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MetadataPanelProps {
  email: ParsedEmail;
}

function AddressList({ addresses, icon: Icon, label }: { 
  addresses?: EmailAddress[]; 
  icon: typeof User; 
  label: string;
}) {
  if (!addresses || addresses.length === 0) return null;
  
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {addresses.map((addr, i) => (
            <Badge 
              key={`${addr.address}-${i}`} 
              variant="secondary" 
              className="font-normal max-w-full"
            >
              <span className="truncate">
                {addr.name ? `${addr.name} <${addr.address}>` : addr.address}
              </span>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetadataItem({ icon: Icon, label, value, className }: {
  icon: typeof Calendar;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          {label}
        </p>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

export function MetadataPanel({ email }: MetadataPanelProps) {
  const hasRecipients = email.to || email.cc || email.bcc;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject */}
        {email.subject && (
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Subject
            </p>
            <h2 className="text-lg font-semibold leading-tight">
              {email.subject}
            </h2>
          </div>
        )}
        
        {/* Date */}
        {email.date && (
          <MetadataItem
            icon={Calendar}
            label="Date"
            value={
              <div className="flex items-center gap-2 flex-wrap">
                <span>{format(email.date, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</span>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(email.date, { addSuffix: true })}
                </Badge>
              </div>
            }
          />
        )}
        
        <Separator />
        
        {/* From */}
        <AddressList 
          addresses={email.from} 
          icon={User} 
          label="From" 
        />
        
        {/* Sender (if different from From) */}
        {email.sender && (
          <AddressList 
            addresses={[email.sender]} 
            icon={ArrowLeftRight} 
            label="Sender (on behalf of)" 
          />
        )}
        
        {/* Recipients */}
        {hasRecipients && (
          <>
            <Separator />
            <AddressList 
              addresses={email.to} 
              icon={Users} 
              label="To" 
            />
            <AddressList 
              addresses={email.cc} 
              icon={Users} 
              label="CC" 
            />
            <AddressList 
              addresses={email.bcc} 
              icon={Users} 
              label="BCC" 
            />
          </>
        )}
        
        {/* Reply-To */}
        {email.replyTo && email.replyTo.length > 0 && (
          <>
            <Separator />
            <AddressList 
              addresses={email.replyTo} 
              icon={Reply} 
              label="Reply-To" 
            />
          </>
        )}
        
        {/* Message ID and threading */}
        {(email.messageId || email.inReplyTo) && (
          <>
            <Separator />
            {email.messageId && (
              <MetadataItem
                icon={Hash}
                label="Message ID"
                value={
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                    {email.messageId}
                  </code>
                }
              />
            )}
            {email.inReplyTo && (
              <MetadataItem
                icon={Reply}
                label="In Reply To"
                value={
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                    {email.inReplyTo}
                  </code>
                }
              />
            )}
          </>
        )}
        
        {/* Return Path */}
        {email.returnPath && (
          <MetadataItem
            icon={ArrowLeftRight}
            label="Return Path (Bounce Address)"
            value={
              <Badge variant="outline" className="font-mono text-xs">
                {email.returnPath}
              </Badge>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
