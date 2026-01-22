'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Paperclip, 
  FileText, 
  FileImage, 
  FileArchive, 
  File,
  Download,
  AlertTriangle,
  Eye
} from 'lucide-react';
import type { EmailAttachment } from '@/types/email';
import { cn } from '@/lib/utils';

interface AttachmentsPanelProps {
  attachments: EmailAttachment[];
}

const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.vbs', '.vbe', '.js', '.jse', '.ws', '.wsf', '.wsc', '.wsh',
  '.ps1', '.psm1', '.psd1', '.ps1xml', '.pssc', '.psc1',
  '.dll', '.sys', '.drv', '.ocx',
  '.hta', '.cpl', '.msc', '.inf', '.reg',
  '.lnk', '.url',
  '.jar', '.class',
  '.app', '.dmg', '.pkg',
  '.deb', '.rpm', '.sh', '.bash',
];

const MIME_TYPE_ICONS: Record<string, typeof File> = {
  'image': FileImage,
  'text': FileText,
  'application/pdf': FileText,
  'application/zip': FileArchive,
  'application/x-zip': FileArchive,
  'application/x-rar': FileArchive,
  'application/x-7z': FileArchive,
  'application/gzip': FileArchive,
  'application/x-tar': FileArchive,
};

function getFileIcon(mimeType: string): typeof File {
  // Check exact match first
  if (MIME_TYPE_ICONS[mimeType]) {
    return MIME_TYPE_ICONS[mimeType];
  }
  
  // Check category match (e.g., "image/png" -> "image")
  const category = mimeType.split('/')[0];
  if (MIME_TYPE_ICONS[category]) {
    return MIME_TYPE_ICONS[category];
  }
  
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

function isDangerous(filename: string): boolean {
  const lower = filename.toLowerCase();
  return DANGEROUS_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

interface AttachmentCardProps {
  attachment: EmailAttachment;
  onDownload: () => void;
  onPreview?: () => void;
}

function AttachmentCard({ attachment, onDownload, onPreview }: AttachmentCardProps) {
  const Icon = getFileIcon(attachment.mimeType);
  const dangerous = isDangerous(attachment.filename);
  const canPreview = isPreviewable(attachment.mimeType);
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
      dangerous 
        ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
        : 'bg-card hover:bg-muted/50'
    )}>
      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
        dangerous ? 'bg-red-100 dark:bg-red-900/50' : 'bg-muted'
      )}>
        <Icon className={cn(
          'w-5 h-5',
          dangerous ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
        )} />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" title={attachment.filename}>
          {attachment.filename}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(attachment.size)}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <Badge variant="secondary" className="text-xs font-mono">
            {attachment.mimeType.split('/')[1] || attachment.mimeType}
          </Badge>
          {attachment.disposition === 'inline' && (
            <Badge variant="outline" className="text-xs">
              Inline
            </Badge>
          )}
        </div>
      </div>
      
      {/* Warning for dangerous files */}
      {dangerous && (
        <div className="shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {canPreview && onPreview && (
          <Button variant="ghost" size="sm" onClick={onPreview} className="h-8 w-8 p-0">
            <Eye className="w-4 h-4" />
          </Button>
        )}
        <Button 
          variant={dangerous ? 'outline' : 'ghost'} 
          size="sm" 
          onClick={onDownload}
          className={cn('h-8 w-8 p-0', dangerous && 'border-red-300 dark:border-red-700')}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function AttachmentsPanel({ attachments }: AttachmentsPanelProps) {
  const [previewAttachment, setPreviewAttachment] = useState<EmailAttachment | null>(null);
  
  const handleDownload = useCallback((attachment: EmailAttachment) => {
    // Create a blob from the attachment content
    const blob = new Blob([attachment.content.buffer as ArrayBuffer], { type: attachment.mimeType });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    URL.revokeObjectURL(url);
  }, []);
  
  const handlePreview = useCallback((attachment: EmailAttachment) => {
    setPreviewAttachment(attachment);
  }, []);
  
  const dangerousCount = attachments.filter(a => isDangerous(a.filename)).length;
  const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
  
  if (attachments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Attachments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No attachments in this email</p>
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
              <Paperclip className="w-5 h-5" />
              Attachments
            </CardTitle>
            <CardDescription>
              {attachments.length} file{attachments.length !== 1 ? 's' : ''} • {formatFileSize(totalSize)} total
            </CardDescription>
          </div>
          {dangerousCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {dangerousCount} potentially dangerous
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {dangerousCount > 0 && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This email contains potentially dangerous file types. 
              Exercise caution before downloading or opening these files.
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <AttachmentCard
                key={`${attachment.filename}-${index}`}
                attachment={attachment}
                onDownload={() => handleDownload(attachment)}
                onPreview={isPreviewable(attachment.mimeType) ? () => handlePreview(attachment) : undefined}
              />
            ))}
          </div>
        </ScrollArea>
        
        {/* Image Preview Modal */}
        {previewAttachment && previewAttachment.mimeType.startsWith('image/') && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            onClick={() => setPreviewAttachment(null)}
          >
            <div className="max-w-4xl max-h-[90vh] p-4">
              <img
                src={URL.createObjectURL(new Blob([previewAttachment.content.buffer as ArrayBuffer], { type: previewAttachment.mimeType }))}
                alt={previewAttachment.filename}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <p className="text-center text-white text-sm mt-2">{previewAttachment.filename}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
