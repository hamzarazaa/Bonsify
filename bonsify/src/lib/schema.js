const SITE_URL = "https://bonsify.io";

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqPageSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export const ORG_ID = `${SITE_URL}/#organization`;
export const SITE_ID = `${SITE_URL}/#website`;

// Site-wide entity graph (rendered once in the root layout): who Bonsify is,
// where it operates, and the site itself. Every page-level schema points back
// to ORG_ID, which is what lets search and answer engines tie the pages to
// one entity. Social profile URLs go in NEXT_PUBLIC_SAME_AS (comma-separated).
export function siteGraph() {
  const sameAs = [
    "https://fetchsky.com",
    ...(process.env.NEXT_PUBLIC_SAME_AS || "").split(",").map((s) => s.trim()).filter(Boolean),
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "ProfessionalService"],
        "@id": ORG_ID,
        name: "Bonsify",
        legalName: "Bonsify by FetchSky",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/images/logos/Bonsify---Logo.png` },
        image: `${SITE_URL}/images/og-image.jpg`,
        description:
          "Bonsify is a done-for-you Shopify mobile app service. We design, build, launch and maintain native iOS and Android apps and PWAs for Shopify stores.",
        slogan: "Beyond the browser. Onto the home screen.",
        email: "hello@bonsify.io",
        telephone: "+1-251-277-9302",
        parentOrganization: { "@type": "Organization", name: "FetchSky", url: "https://fetchsky.com" },
        knowsAbout: [
          "Shopify mobile apps",
          "Native iOS and Android app development",
          "Progressive web apps",
          "Push notifications",
          "Shopify app store submission",
          "Install-to-purchase attribution",
        ],
        areaServed: "Worldwide",
        priceRange: "$$",
        contactPoint: [
          { "@type": "ContactPoint", contactType: "sales", email: "hello@bonsify.io", telephone: "+1-251-277-9302", availableLanguage: "English" },
        ],
        address: [
          { "@type": "PostalAddress", streetAddress: "1942 Blair Ave", addressLocality: "Santa Ana", addressRegion: "CA", postalCode: "92705", addressCountry: "US" },
          { "@type": "PostalAddress", streetAddress: "Building S4, NASTP-2, Office 18A, Shahra-e-Faisal", addressLocality: "Karachi", postalCode: "75400", addressCountry: "PK" },
        ],
        sameAs,
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        url: SITE_URL,
        name: "Bonsify",
        inLanguage: "en",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}
