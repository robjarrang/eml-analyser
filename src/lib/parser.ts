import PostalMime from 'postal-mime';
import type {
  ParsedEmail,
  EmailAddress,
  EmailHeader,
  EmailAttachment,
  AuthenticationResult,
  ReceivedHop,
  EmailAnalysis,
  AnalysisWarning,
} from '@/types/email';

/**
 * Parse an EML file and extract all relevant information
 */
export async function parseEmlFile(content: string | ArrayBuffer): Promise<EmailAnalysis> {
  const startTime = performance.now();
  const warnings: AnalysisWarning[] = [];
  
  const parser = new PostalMime();
  const parsed = await parser.parse(content);
  
  // Extract headers into our format
  const headers: EmailHeader[] = parsed.headers.map((h) => ({
    key: h.key,
    value: h.value,
  }));
  
  // Parse addresses
  const from = parseAddresses(parsed.from);
  const to = parseAddresses(parsed.to);
  const cc = parseAddresses(parsed.cc);
  const bcc = parseAddresses(parsed.bcc);
  const replyTo = parseAddresses(parsed.replyTo);
  const sender = parsed.sender ? parseAddress(parsed.sender) : undefined;
  
  // Extract return path
  const returnPathHeader = findHeader(headers, 'return-path');
  const returnPath = returnPathHeader ? extractEmailFromHeader(returnPathHeader) : undefined;
  
  // Parse attachments
  const attachments: EmailAttachment[] = (parsed.attachments || []).map((att) => {
    let content: Uint8Array;
    let size: number;
    
    if (att.content instanceof ArrayBuffer) {
      content = new Uint8Array(att.content);
      size = att.content.byteLength;
    } else if (typeof att.content === 'string') {
      const encoder = new TextEncoder();
      content = encoder.encode(att.content);
      size = content.length;
    } else {
      content = new Uint8Array(0);
      size = 0;
    }
    
    return {
      filename: att.filename || 'unnamed',
      mimeType: att.mimeType || 'application/octet-stream',
      size,
      content,
      contentId: att.contentId,
      disposition: att.disposition === 'inline' ? 'inline' : 'attachment',
    };
  });
  
  // Parse authentication headers
  const authentication = parseAuthenticationHeaders(headers);
  
  // Parse received chain
  const receivedChain = parseReceivedChain(headers);
  
  // Generate warnings
  generateWarnings(warnings, authentication, from, returnPath, headers);
  
  // Get raw content
  const rawContent = typeof content === 'string' 
    ? content 
    : new TextDecoder().decode(content);
  
  const email: ParsedEmail = {
    messageId: parsed.messageId,
    subject: parsed.subject,
    date: parsed.date ? new Date(parsed.date) : undefined,
    from,
    to,
    cc,
    bcc,
    replyTo,
    returnPath,
    sender,
    html: parsed.html,
    text: parsed.text,
    headers,
    attachments,
    authentication,
    receivedChain,
    rawContent,
    inReplyTo: parsed.inReplyTo,
    references: parsed.references ? parsed.references.split(/\s+/).filter(Boolean) : undefined,
  };
  
  const parseTime = performance.now() - startTime;
  
  return { email, warnings, parseTime };
}

function parseAddress(addr: { name?: string; address?: string } | string): EmailAddress | undefined {
  if (typeof addr === 'string') {
    return { address: addr };
  }
  if (addr.address) {
    return { name: addr.name, address: addr.address };
  }
  return undefined;
}

function parseAddresses(addrs: unknown): EmailAddress[] | undefined {
  if (!addrs) return undefined;
  
  if (typeof addrs === 'string') {
    return [{ address: addrs }];
  }
  
  if (Array.isArray(addrs)) {
    return addrs
      .map((a) => parseAddress(a))
      .filter((a): a is EmailAddress => a !== undefined);
  }
  
  if (typeof addrs === 'object' && addrs !== null) {
    const parsed = parseAddress(addrs as { name?: string; address?: string });
    return parsed ? [parsed] : undefined;
  }
  
  return undefined;
}

function findHeader(headers: EmailHeader[], key: string): string | undefined {
  const header = headers.find((h) => h.key.toLowerCase() === key.toLowerCase());
  return header?.value;
}

function findAllHeaders(headers: EmailHeader[], key: string): string[] {
  return headers
    .filter((h) => h.key.toLowerCase() === key.toLowerCase())
    .map((h) => h.value);
}

function extractEmailFromHeader(value: string): string {
  const match = value.match(/<([^>]+)>/) || value.match(/([^\s<>]+@[^\s<>]+)/);
  return match ? match[1] : value;
}

/**
 * Parse authentication-related headers (SPF, DKIM, DMARC, ARC)
 */
function parseAuthenticationHeaders(headers: EmailHeader[]): AuthenticationResult[] {
  const results: AuthenticationResult[] = [];
  
  // Parse Authentication-Results header
  const authResults = findAllHeaders(headers, 'authentication-results');
  for (const authResult of authResults) {
    results.push(...parseAuthenticationResultsHeader(authResult));
  }
  
  // Parse Received-SPF header
  const spfResults = findAllHeaders(headers, 'received-spf');
  for (const spf of spfResults) {
    const result = parseSpfHeader(spf);
    if (result) results.push(result);
  }
  
  // Parse DKIM-Signature header
  const dkimSigs = findAllHeaders(headers, 'dkim-signature');
  for (const dkim of dkimSigs) {
    const result = parseDkimSignatureHeader(dkim);
    if (result) results.push(result);
  }
  
  // Parse ARC headers
  const arcSeals = findAllHeaders(headers, 'arc-seal');
  for (const arc of arcSeals) {
    const result = parseArcHeader(arc);
    if (result) results.push(result);
  }
  
  // Deduplicate by method (keep most detailed)
  return deduplicateAuthResults(results);
}

function parseAuthenticationResultsHeader(header: string): AuthenticationResult[] {
  const results: AuthenticationResult[] = [];
  
  // Match patterns like "spf=pass", "dkim=pass", "dmarc=pass"
  const patterns = [
    { regex: /spf=(\w+)(?:\s+\(([^)]+)\))?/i, method: 'spf' as const },
    { regex: /dkim=(\w+)(?:\s+\(([^)]+)\))?(?:\s+header\.[di]=([^\s;]+))?/i, method: 'dkim' as const },
    { regex: /dmarc=(\w+)(?:\s+\(([^)]+)\))?/i, method: 'dmarc' as const },
    { regex: /arc=(\w+)(?:\s+\(([^)]+)\))?/i, method: 'arc' as const },
  ];
  
  for (const { regex, method } of patterns) {
    const match = header.match(regex);
    if (match) {
      const result = normalizeResult(match[1]);
      const details = match[2] || '';
      const domain = match[3] || extractDomainFromDetails(header, method);
      
      results.push({
        method,
        result,
        details: details || `${method.toUpperCase()}=${match[1]}`,
        domain,
        rawHeader: header,
      });
    }
  }
  
  return results;
}

function parseSpfHeader(header: string): AuthenticationResult | null {
  const resultMatch = header.match(/^(\w+)/i);
  if (!resultMatch) return null;
  
  const domainMatch = header.match(/envelope-from=([^\s;]+)/i) || 
                      header.match(/identity=([^\s;]+)/i) ||
                      header.match(/sender ([^\s;]+)/i);
  
  return {
    method: 'spf',
    result: normalizeResult(resultMatch[1]),
    details: header,
    domain: domainMatch?.[1],
    rawHeader: header,
  };
}

function parseDkimSignatureHeader(header: string): AuthenticationResult | null {
  const domainMatch = header.match(/d=([^\s;]+)/i);
  const selectorMatch = header.match(/s=([^\s;]+)/i);
  
  return {
    method: 'dkim',
    result: 'unknown', // Signature presence doesn't indicate verification result
    details: `Signed by ${domainMatch?.[1] || 'unknown'} (selector: ${selectorMatch?.[1] || 'unknown'})`,
    domain: domainMatch?.[1],
    selector: selectorMatch?.[1],
    rawHeader: header,
  };
}

function parseArcHeader(header: string): AuthenticationResult | null {
  const cvMatch = header.match(/cv=(\w+)/i);
  const domainMatch = header.match(/d=([^\s;]+)/i);
  
  return {
    method: 'arc',
    result: cvMatch ? normalizeResult(cvMatch[1]) : 'unknown',
    details: header,
    domain: domainMatch?.[1],
    rawHeader: header,
  };
}

function normalizeResult(result: string): AuthenticationResult['result'] {
  const normalized = result.toLowerCase();
  const validResults: AuthenticationResult['result'][] = [
    'pass', 'fail', 'softfail', 'neutral', 'none', 'temperror', 'permerror'
  ];
  return validResults.includes(normalized as AuthenticationResult['result'])
    ? (normalized as AuthenticationResult['result'])
    : 'unknown';
}

function extractDomainFromDetails(header: string, method: string): string | undefined {
  if (method === 'dkim') {
    const match = header.match(/header\.[di]=@?([^\s;@]+)/i);
    return match?.[1];
  }
  return undefined;
}

function deduplicateAuthResults(results: AuthenticationResult[]): AuthenticationResult[] {
  const byMethod = new Map<string, AuthenticationResult>();
  
  for (const result of results) {
    const key = `${result.method}-${result.domain || 'unknown'}`;
    const existing = byMethod.get(key);
    
    // Prefer results with actual pass/fail over unknown
    if (!existing || (existing.result === 'unknown' && result.result !== 'unknown')) {
      byMethod.set(key, result);
    }
  }
  
  return Array.from(byMethod.values());
}

/**
 * Parse Received headers to build the routing chain
 */
function parseReceivedChain(headers: EmailHeader[]): ReceivedHop[] {
  const receivedHeaders = findAllHeaders(headers, 'received');
  const hops: ReceivedHop[] = [];
  
  for (const header of receivedHeaders) {
    const hop = parseReceivedHeader(header);
    hops.push(hop);
  }
  
  // Calculate delays between hops
  // Note: Received headers are in reverse order (most recent first)
  for (let i = 0; i < hops.length - 1; i++) {
    const current = hops[i];
    const previous = hops[i + 1];
    
    if (current.timestamp && previous.timestamp) {
      current.delay = current.timestamp.getTime() - previous.timestamp.getTime();
    }
  }
  
  return hops;
}

function parseReceivedHeader(header: string): ReceivedHop {
  // Extract "from" server
  const fromMatch = header.match(/from\s+([^\s(]+)/i);
  
  // Extract "by" server
  const byMatch = header.match(/by\s+([^\s(]+)/i);
  
  // Extract "with" protocol
  const withMatch = header.match(/with\s+(\w+)/i);
  
  // Extract timestamp (usually at the end after semicolon)
  const timestampMatch = header.match(/;\s*(.+)$/);
  let timestamp: Date | undefined;
  
  if (timestampMatch) {
    const parsed = new Date(timestampMatch[1].trim());
    if (!isNaN(parsed.getTime())) {
      timestamp = parsed;
    }
  }
  
  return {
    from: fromMatch?.[1],
    by: byMatch?.[1],
    with: withMatch?.[1],
    timestamp,
    rawHeader: header,
  };
}

/**
 * Generate analysis warnings based on parsed data
 */
function generateWarnings(
  warnings: AnalysisWarning[],
  authentication: AuthenticationResult[],
  from: EmailAddress[] | undefined,
  returnPath: string | undefined,
  headers: EmailHeader[]
): void {
  // Check for failed authentication
  for (const auth of authentication) {
    if (auth.result === 'fail' || auth.result === 'permerror') {
      warnings.push({
        severity: 'error',
        title: `${auth.method.toUpperCase()} Authentication Failed`,
        description: auth.details || `The ${auth.method.toUpperCase()} check failed for this email.`,
        relatedHeader: auth.rawHeader,
      });
    } else if (auth.result === 'softfail') {
      warnings.push({
        severity: 'warning',
        title: `${auth.method.toUpperCase()} Soft Fail`,
        description: auth.details || `The ${auth.method.toUpperCase()} check resulted in a soft fail.`,
        relatedHeader: auth.rawHeader,
      });
    } else if (auth.result === 'temperror') {
      warnings.push({
        severity: 'warning',
        title: `${auth.method.toUpperCase()} Temporary Error`,
        description: `There was a temporary error checking ${auth.method.toUpperCase()}.`,
        relatedHeader: auth.rawHeader,
      });
    }
  }
  
  // Check for missing authentication
  const methods = new Set(authentication.map((a) => a.method));
  if (!methods.has('spf')) {
    warnings.push({
      severity: 'info',
      title: 'No SPF Record Found',
      description: 'This email has no SPF authentication results. The sending domain may not have SPF configured.',
    });
  }
  if (!methods.has('dkim')) {
    warnings.push({
      severity: 'info',
      title: 'No DKIM Signature Found',
      description: 'This email has no DKIM signature or authentication results.',
    });
  }
  if (!methods.has('dmarc')) {
    warnings.push({
      severity: 'info',
      title: 'No DMARC Record Found',
      description: 'This email has no DMARC authentication results.',
    });
  }
  
  // Check for Return-Path mismatch with From
  if (from && from[0] && returnPath) {
    const fromDomain = from[0].address.split('@')[1]?.toLowerCase();
    const returnPathDomain = returnPath.split('@')[1]?.toLowerCase();
    
    if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
      warnings.push({
        severity: 'warning',
        title: 'Return-Path Domain Mismatch',
        description: `The Return-Path domain (${returnPathDomain}) differs from the From domain (${fromDomain}). This is common for mailing lists but could indicate spoofing.`,
      });
    }
  }
  
  // Check for suspicious headers
  const xMailer = findHeader(headers, 'x-mailer');
  if (xMailer && /php|script/i.test(xMailer)) {
    warnings.push({
      severity: 'info',
      title: 'Automated Sending Detected',
      description: `This email appears to have been sent by an automated script (X-Mailer: ${xMailer}).`,
      relatedHeader: xMailer,
    });
  }
}
