/** @type {import('next').NextConfig} */
const nextConfig = {
  // Decap CMS lives in public/admin. Next drops the trailing slash from /admin/,
  // so serve the editor page for the bare /admin address too.
  async rewrites() {
    return [{ source: "/admin", destination: "/admin/index.html" }];
  },
  // The old /lab preview is gone: everything lives on the home page now.
  async redirects() {
    return [{ source: "/lab", destination: "/", permanent: true }];
  },
  // The lab copy of the site must never be indexed.
  async headers() {
    const lab = process.env.NEXT_PUBLIC_LAB === "1";
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return lab ? [{ source: "/:path*", headers: noindex }] : [];
  },
};

export default nextConfig;
