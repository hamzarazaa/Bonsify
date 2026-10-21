/** @type {import('next-sitemap').IConfig} */

// Mirrors the env-var-driven visibility flags in src/lib/clients.js. Kept
// as a separate check here (rather than importing that file) because this
// config runs as a standalone CommonJS script in the postbuild step,
// outside Next's own module pipeline, which can't load that file's ES
// module syntax directly - but both read the same process.env vars, so a
// Vercel env var flip stays in sync between the pages Next builds and the
// sitemap listing them, without editing this file too.
const HIDDEN_CLIENT_PATHS = [
  process.env.NEXT_PUBLIC_SHOW_BACHAPARTY !== 'true' && '/work/bachaparty',
  process.env.NEXT_PUBLIC_SHOW_HIGHFY !== 'true' && '/work/highfy',
].filter(Boolean);

module.exports = {
  siteUrl: 'https://bonsify.io',
  // 'public', not the old static-export 'out' dir - next build no longer
  // produces one now that output:'export' is gone (see next.config.mjs),
  // and next-sitemap's non-export mode expects to write here so Next
  // serves the generated sitemap.xml as a normal static asset.
  outDir: 'public',
  generateRobotsTxt: false,
  // /for/* are private, one-to-one proposal pages (noindex), never listed.
  exclude: ['/apple-icon.png', '/admin', '/status', '/for/*', ...HIDDEN_CLIENT_PATHS],
};
