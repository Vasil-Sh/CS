import { Helmet } from 'react-helmet-async';

/**
 * JSON-LD structured data components for rich search results.
 * Reference: https://schema.org
 */

interface WebAppStructuredDataProps {
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price?: string;
    priceCurrency?: string;
  };
}

export function WebAppStructuredData({
  name = 'MatchIQ',
  description = 'Професійна аналітика ставок на CS2. EV-детектор, алгоритм Келлі, трекінг банкролу та AI-рекомендації.',
  url = 'https://matchiq.pro',
  image = 'https://matchiq.pro/assets/og-image.png',
  applicationCategory = 'FinanceApplication',
  operatingSystem = 'Web',
  offers,
}: WebAppStructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url,
    image,
    applicationCategory,
    operatingSystem,
    browserRequirements: 'Requires JavaScript',
    ...(offers?.price && {
      offers: {
        '@type': 'Offer',
        price: offers.price,
        priceCurrency: offers.priceCurrency ?? 'USD',
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

interface OrganizationStructuredDataProps {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

export function OrganizationStructuredData({
  name = 'MatchIQ',
  description = 'CS2 Match Analytics and Betting Intelligence Platform',
  url = 'https://matchiq.pro',
  logo = 'https://matchiq.pro/favicon.svg',
  sameAs = [],
}: OrganizationStructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description,
    url,
    logo,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

interface FAQStructuredDataProps {
  questions: { question: string; answer: string }[];
}

export function FAQStructuredData({ questions }: FAQStructuredDataProps) {
  if (!questions.length) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}

interface BreadcrumbStructuredDataProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
