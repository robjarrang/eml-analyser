# EML Analyzer

A privacy-first, client-side email file (.eml) analyzer built with Next.js. Analyze email headers, authentication records, routing information, and preview content—all processed securely in your browser.

## Features

### 🔒 100% Private & Secure
- **No server uploads** - Files are processed entirely in your browser using the Web File API
- **No data leaves your device** - Zero network requests during analysis
- **Content Security Policy** - Strict CSP headers prevent XSS and data exfiltration
- **HTML sanitization** - Email content is sanitized with DOMPurify before rendering

### 🛡️ Domain Authentication Analysis
- **SPF** (Sender Policy Framework) verification results
- **DKIM** (DomainKeys Identified Mail) signature analysis
- **DMARC** (Domain-based Message Authentication) policy status
- **ARC** (Authenticated Received Chain) validation
- Clear pass/fail indicators with detailed explanations

### 📧 Email Inspection
- **Metadata overview** - Subject, date, from/to addresses, message ID
- **Header analysis** - Organized view of all email headers
- **Routing trace** - Visual hop-by-hop path through mail servers with timing
- **Attachment handling** - List attachments with size, type, and safe download
- **Content preview** - Sanitized HTML, plain text, and raw source views

### ⚡ Modern Tech Stack
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + **shadcn/ui** for beautiful, accessible UI
- **postal-mime** for RFC-compliant EML parsing
- **DOMPurify** for HTML sanitization

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/eml-analyser.git
cd eml-analyser

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build static export
npm run build

# The output is in the 'out' directory
```

## Deployment

This project is configured for static export, making it perfect for:

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

The `vercel.json` file configures security headers automatically.

### Other Static Hosts
The build output (`out/` directory) can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

## Security

### Client-Side Processing
All file processing happens entirely in the browser:
- Files are read using the FileReader API
- Parsing is done with postal-mime (browser-compatible)
- No data is ever transmitted to any server

### Content Security Policy
The following CSP headers are configured:
- `default-src 'self'` - Only allow same-origin by default
- `script-src 'self'` - Only same-origin scripts
- `img-src 'self' data: blob:` - Allow inline images from attachments
- `frame-src 'none'` - No iframes allowed
- `object-src 'none'` - No plugins

### HTML Sanitization
Email HTML content is sanitized using DOMPurify with strict settings:
- All script tags removed
- Event handlers stripped
- External resources blocked
- Forms disabled

### Dangerous File Warnings
Attachments with potentially dangerous extensions (`.exe`, `.bat`, `.js`, etc.) are flagged with clear warnings.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with header/footer
│   ├── page.tsx        # Main analyzer page
│   └── globals.css     # Tailwind imports
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── EmailAnalyzer.tsx
│   ├── FileDropzone.tsx
│   ├── AuthenticationPanel.tsx
│   ├── EmailPreview.tsx
│   ├── HeadersPanel.tsx
│   ├── MetadataPanel.tsx
│   ├── AttachmentsPanel.tsx
│   └── WarningsPanel.tsx
├── lib/
│   ├── parser.ts       # EML parsing with postal-mime
│   ├── sanitizer.ts    # HTML sanitization
│   └── utils.ts        # Utility functions
└── types/
    └── email.ts        # TypeScript interfaces
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [postal-mime](https://github.com/postalsys/postal-mime) - Excellent EML parsing library
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [DOMPurify](https://github.com/cure53/DOMPurify) - HTML sanitization
