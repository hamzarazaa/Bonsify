// Real device-mockup imagery for the handful of services that map cleanly
// to an existing screenshot. requiresClient gates on src/lib/clients.js so
// a hidden client's screenshot never appears until they've gone live.
export const SERVICE_VISUALS = {
  "mobile-app-development": {
    type: "phone",
    src: "/images/bachaparty/Product_Detail.webp",
    requiresClient: "bachaparty",
  },
  "pwa-development": {
    type: "phone",
    src: "/images/dockify/install-banner.webp",
    requiresClient: "dockify",
    imgPosition: "bottom center",
  },
  "install-to-purchase-attribution": {
    type: "laptop",
    src: "/images/dockify/dashboard-overview-crop.webp",
    requiresClient: "dockify",
    width: 810,
    height: 150,
  },
  "custom-shopify-app-development": {
    type: "phone",
    src: "/images/highfy/Home.webp",
    requiresClient: "highfy",
  },
};
