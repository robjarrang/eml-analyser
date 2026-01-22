'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFileAccepted: (content: ArrayBuffer, filename: string) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

export function FileDropzone({ onFileAccepted, onError, isProcessing = false }: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.eml')) {
      return 'Please upload a valid .eml file';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    // Check MIME type (some systems may not set this correctly)
    const validTypes = [
      'message/rfc822',
      'text/plain',
      'application/octet-stream',
      '', // Some browsers don't set MIME type for .eml
    ];
    if (!validTypes.includes(file.type)) {
      // Don't reject based on MIME type alone, just log
      console.log('Unexpected MIME type:', file.type);
    }

    return null;
  }, []);

  const processFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      onError(error);
      setDragError(error);
      return;
    }

    setDragError(null);

    try {
      const content = await file.arrayBuffer();
      onFileAccepted(content, file.name);
    } catch {
      const errorMsg = 'Failed to read file. Please try again.';
      onError(errorMsg);
      setDragError(errorMsg);
    }
  }, [validateFile, onFileAccepted, onError]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
    setDragError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set inactive if we're leaving the dropzone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isProcessing) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) {
      setDragError('No file detected');
      return;
    }

    if (files.length > 1) {
      setDragError('Please drop only one file at a time');
      return;
    }

    processFile(files[0]);
  }, [isProcessing, processFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [processFile]);

  const handleClick = useCallback(() => {
    if (!isProcessing) {
      inputRef.current?.click();
    }
  }, [isProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main dropzone - Jarrang clean style */}
      <div
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload EML file"
        className={cn(
          'relative flex flex-col items-center justify-center',
          'w-full min-h-70 p-10',
          'border-2 border-dashed rounded-2xl',
          'transition-all duration-200 ease-in-out',
          'cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
          isDragActive && !isProcessing && [
            'border-accent bg-accent/5',
            'scale-[1.01]',
          ],
          !isDragActive && !isProcessing && [
            'border-border hover:border-accent/50',
            'bg-card hover:bg-accent/5',
          ],
          isProcessing && [
            'border-border bg-card',
            'cursor-wait',
          ],
          dragError && 'border-destructive/50 bg-destructive/5'
        )}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".eml,message/rfc822"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {/* Icon */}
        <div
          className={cn(
            'mb-5 p-5 rounded-2xl',
            'transition-all duration-200',
            isDragActive ? 'bg-accent/10 scale-110' : 'bg-secondary',
            isProcessing && 'animate-pulse'
          )}
        >
          {isProcessing ? (
            <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          ) : dragError ? (
            <AlertCircle className="w-10 h-10 text-destructive" />
          ) : isDragActive ? (
            <Upload className="w-10 h-10 text-accent" />
          ) : (
            <FileText className="w-10 h-10 text-primary" />
          )}
        </div>

        {/* Text content */}
        <div className="text-center space-y-2">
          {isProcessing ? (
            <>
              <p className="text-xl font-semibold text-primary">
                Analyzing email...
              </p>
              <p className="text-sm text-muted-foreground">
                Processing your file locally
              </p>
            </>
          ) : dragError ? (
            <>
              <p className="text-xl font-semibold text-destructive">
                {dragError}
              </p>
              <p className="text-sm text-muted-foreground">
                Please try again with a valid .eml file
              </p>
            </>
          ) : isDragActive ? (
            <>
              <p className="text-xl font-semibold text-accent">
                Drop your file here
              </p>
              <p className="text-sm text-muted-foreground">
                Release to start analysis
              </p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold text-primary">
                Drop your .eml file here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse your files
              </p>
              <p className="text-xs text-muted-foreground/70 mt-3">
                Maximum file size: 50MB
              </p>
            </>
          )}
        </div>
      </div>

      {/* Privacy notice - Jarrang style */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-accent" />
        <span className="text-muted-foreground">
          <strong className="text-foreground">100% Private</strong> — Your file is processed entirely in your browser.
          No data is ever sent to any server.
        </span>
      </div>
    </div>
  );
}
