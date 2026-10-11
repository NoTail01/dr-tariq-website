# Google integrations (GA4, GTM, Search Console, Maps)

Every integration below is **inactive until its environment variable is set**
(see `.env.example`). Nothing is loaded, and no personal or medical
information is ever collected — only anonymous page-view metadata.

## Variables

| Variable | Purpose | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics 4 measurement ID (`G-…`) | Injected directly **only if no GTM container is set** |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID (`GTM-…`) | If set, add the GA4 tag inside the container instead of also setting `NEXT_PUBLIC_GA4_ID` |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console verification token | Rendered as `<meta name="google-site-verification">` |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | Maps **embed** URL from Google Maps → Share → Embed a map | Renders on the contact section once set |

## Avoid double counting

- Both `NEXT_PUBLIC_GTM_ID` and `NEXT_PUBLIC_GA4_ID` set → GA4 is skipped
  automatically (`src/lib/analytics.ts`). Keep GA4 tags in the GTM container.
- Only GA4 configured → the `gtag.js` script is injected directly.
- Nothing configured → no third-party script is sent to visitors at all.

## Content-Security-Policy

CSP is opt-in with `NEXT_PUBLIC_SECURITY_HEADERS_CSP=1` because development
and each integration need different sources. The policy in `next.config.ts`
adds origin entries only for the services that are actually enabled:

| With this variable set | CSP sources added |
| --- | --- |
| `NEXT_PUBLIC_GA4_ID` | `googletagmanager.com`, `*.google-analytics.com`, `*.analytics.google.com` to `script-src`/`connect-src` |
| `NEXT_PUBLIC_GTM_ID` | `googletagmanager.com` to `script-src`/`connect-src` |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | `www.google.com` / `maps.google.com` to `frame-src`; `*.google.com` / `*.gstatic.com` to `img-src` |

Enable it after verifying the integration works in the browser console, e.g.:

```bash
NEXT_PUBLIC_SECURITY_HEADERS_CSP=1 npm run build && npm run start
```

Other security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
Permissions-Policy, HSTS in production) are always on and need no configuration.
