import { Helmet } from 'react-helmet-async';

interface SEOProps {
  /** Page title. Appended to " | MatchIQ" */
  title?: string;
  /** Meta description (recommended: 150–160 chars) */
  description?: string;
  /** Canonical URL (full absolute URL) */
  canonical?: string;
  /** OG image URL (full absolute URL, recommended 1200×630) */
  ogImage?: string;
  /** Page type: 'website' | 'article' */
  ogType?: 'website' | 'article';
  /** Ukrainian alternate URL for hreflang */
  ukHref?: string;
  /** English alternate URL for hreflang */
  enHref?: string;
  /** No index / no follow for admin / private pages */
  noIndex?: boolean;
}

const SITE_NAME = 'MatchIQ';
const BASE_URL = 'https://matchiq.pro';
const DEFAULT_DESCRIPTION =
  'MatchIQ — професійна аналітика ставок на CS2. EV-детектор, алгоритм Келлі, трекінг банкролу та AI-рекомендації. Контролюйте ризики та збільшуйте ROI.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/og-image.png`;

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  ukHref,
  enHref,
  noIndex = false,
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Аналітика ставок на CS2`;
  const canonicalUrl = canonical ?? BASE_URL;

  return (
    <Helmet>
      {/* ── Primary Meta ── */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* ── Robots ── */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      {/* ── Open Graph ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:locale" content="uk_UA" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {/* ── hreflang ── */}
      {ukHref && <link rel="alternate" hrefLang="uk" href={ukHref} />}
      {enHref && <link rel="alternate" hrefLang="en" href={enHref} />}
      {(ukHref || enHref) && <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />}

      {/* ── Mobile / PWA ── */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
    </Helmet>
  );
}
