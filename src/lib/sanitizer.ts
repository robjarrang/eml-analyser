import DOMPurify from 'dompurify';

/**
 * Sanitize HTML email content to prevent XSS and other attacks
 */
export function sanitizeHtml(html: string): string {
  // Configure DOMPurify with strict settings for email content
  const clean = DOMPurify.sanitize(html, {
    // Forbid dangerous tags
    FORBID_TAGS: [
      'script',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'meta',
      'link',
      'base',
      'frame',
      'frameset',
      'applet',
      'math', // Can be used for exfiltration
      'svg', // Can contain scripts
    ],
    
    // Forbid dangerous attributes
    FORBID_ATTR: [
      'onerror',
      'onclick',
      'onload',
      'onmouseover',
      'onmouseout',
      'onmouseenter',
      'onmouseleave',
      'onfocus',
      'onblur',
      'onsubmit',
      'onreset',
      'onchange',
      'oninput',
      'onkeydown',
      'onkeyup',
      'onkeypress',
      'ondrag',
      'ondragstart',
      'ondragend',
      'ondragover',
      'ondragleave',
      'ondrop',
      'formaction',
      'xlink:href',
      'xmlns',
    ],
    
    // Don't allow data attributes
    ALLOW_DATA_ATTR: false,
    
    // Return HTML string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    
    // Ensure we sanitize in HTML mode
    PARSER_MEDIA_TYPE: 'text/html',
  });
  
  // Post-process to handle external resources
  return processExternalResources(clean);
}

/**
 * Process external resources in HTML content
 * Replace external images with placeholders and warn about tracking
 */
function processExternalResources(html: string): string {
  // Replace external images with a placeholder div
  // This prevents tracking pixels and malicious resources
  let processed = html.replace(
    /<img\s+[^>]*src\s*=\s*["']?(https?:\/\/[^"'\s>]+)["']?[^>]*>/gi,
    (match, url) => {
      // Keep data: URLs (inline images)
      if (url.startsWith('data:')) {
        return match;
      }
      // Replace external images with placeholder
      return `<div class="external-image-placeholder" data-original-src="${escapeHtml(url)}" title="External image blocked: ${escapeHtml(url)}">
        <span class="text-muted-foreground text-sm">🖼️ External image blocked</span>
      </div>`;
    }
  );
  
  // Remove or neutralize external CSS
  processed = processed.replace(
    /<link\s+[^>]*href\s*=\s*["']?https?:\/\/[^"'\s>]+["']?[^>]*>/gi,
    '<!-- External stylesheet removed for security -->'
  );
  
  // Remove @import rules that could load external CSS
  processed = processed.replace(
    /@import\s+(?:url\s*\()?["']?https?:\/\/[^"');\s]+["']?\)?[^;]*;?/gi,
    '/* External import removed for security */'
  );
  
  return processed;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Create a safe iframe sandbox configuration for displaying email HTML
 */
export function getSandboxAttributes(): string {
  // Very restrictive sandbox - no scripts, no forms, no popups
  return 'sandbox="allow-same-origin"';
}

/**
 * Check if content contains potentially dangerous elements
 */
export function analyzeContentSafety(html: string): {
  hasExternalImages: boolean;
  hasExternalLinks: boolean;
  hasTrackingPixels: boolean;
  externalDomains: string[];
} {
  const externalDomains = new Set<string>();
  
  // Check for external images
  const imgMatches = html.matchAll(/<img\s+[^>]*src\s*=\s*["']?(https?:\/\/[^"'\s>]+)["']?/gi);
  let hasExternalImages = false;
  let hasTrackingPixels = false;
  
  for (const match of imgMatches) {
    hasExternalImages = true;
    try {
      const url = new URL(match[1]);
      externalDomains.add(url.hostname);
      
      // Check for common tracking pixel patterns
      if (
        /track|pixel|open|beacon|analytics|stat|click|email/i.test(url.pathname) ||
        url.searchParams.has('id') ||
        url.searchParams.has('uid') ||
        url.searchParams.has('email')
      ) {
        hasTrackingPixels = true;
      }
    } catch {
      // Invalid URL, skip
    }
  }
  
  // Check for external links
  const linkMatches = html.matchAll(/<a\s+[^>]*href\s*=\s*["']?(https?:\/\/[^"'\s>]+)["']?/gi);
  let hasExternalLinks = false;
  
  for (const match of linkMatches) {
    hasExternalLinks = true;
    try {
      const url = new URL(match[1]);
      externalDomains.add(url.hostname);
    } catch {
      // Invalid URL, skip
    }
  }
  
  return {
    hasExternalImages,
    hasExternalLinks,
    hasTrackingPixels,
    externalDomains: Array.from(externalDomains),
  };
}
