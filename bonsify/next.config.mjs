/** @type {import('next').NextConfig} */
const nextConfig = {
  // Decap CMS lives in public/admin. Next drops the trailing slash from /admin/,
  // so serve the editor page for the bare /admin address too.
  async rewrites() {
    return [{ source: "/admin", destination: "/admin/index.html" }];
  },
  // The lab copy of the site must never be indexed. /lab is private on the
  // main site too.
  async headers() {
    const lab = process.env.NEXT_PUBLIC_LAB === "1";
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return lab ? [{ source: "/:path*", headers: noindex }] : [{ source: "/lab", headers: noindex }];
  },
};

export default nextConfig;
