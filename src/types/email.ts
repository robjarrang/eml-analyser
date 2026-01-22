// Types for parsed EML data

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailHeader {
  key: string;
  value: string;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  content: Uint8Array;
  contentId?: string;
  disposition?: 'attachment' | 'inline';
}

export interface AuthenticationResult {
  method: 'spf' | 'dkim' | 'dmarc' | 'arc' | 'unknown';
  result: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | 'temperror' | 'permerror' | 'unknown';
  details: string;
  domain?: string;
  selector?: string;
  rawHeader?: string;
}

export interface ReceivedHop {
  from?: string;
  by?: string;
  with?: string;
  timestamp?: Date;
  delay?: number; // milliseconds from previous hop
  rawHeader: string;
}

export interface ParsedEmail {
  // Basic metadata
  messageId?: string;
  subject?: string;
  date?: Date;
  
  // Addresses
  from?: EmailAddress[];
  to?: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress[];
  returnPath?: string;
  sender?: EmailAddress;
  
  // Content
  html?: string;
  text?: string;
  
  // Headers
  headers: EmailHeader[];
  
  // Attachments
  attachments: EmailAttachment[];
  
  // Authentication
  authentication: AuthenticationResult[];
  
  // Routing
  receivedChain: ReceivedHop[];
  
  // Raw content for display
  rawContent: string;
  
  // Threading
  inReplyTo?: string;
  references?: string[];
}

export interface AnalysisWarning {
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  relatedHeader?: string;
}

export interface EmailAnalysis {
  email: ParsedEmail;
  warnings: AnalysisWarning[];
  parseTime: number; // milliseconds
}
