// Shopify apps and services a Bonsify app connects to. The list covers what the
// leading Shopify mobile app builders publish (Tapcart, MobiLoud, Vajro,
// Shopney, Appbrew), checked against their integration pages in October 2026,
// so a store never loses a tool by moving to a done-for-you app. Support for a
// specific app is confirmed per store during the free audit.

// Each category has its own page (/integration-categories/<id>) and each app
// has its own page (/integrations/<slug>).
export const CATEGORIES = [
  {
    id: "reviews",
    title: "Reviews & UGC",
    short: "Ratings, photo reviews and customer content on the product page.",
    intro: "Reviews are the last thing a shopper reads before buying. Bonsify shows the ratings and written reviews from your reviews app on every product screen in the app, and lets shoppers write a review without leaving it.",
    uses: ["Star ratings on product cards and the product screen", "Photo and video reviews in a swipeable gallery", "Write-a-review from the order history", "Review requests as push notifications after delivery"],
  },
  {
    id: "loyalty",
    title: "Loyalty & referrals",
    short: "Points, tiers, rewards and refer-a-friend inside the account tab.",
    intro: "Points and tiers work best when shoppers can see them every day. The Account tab shows balance, tier progress and rewards from your loyalty app, and push reminds shoppers before points expire.",
    uses: ["Points balance and tier progress in the Account tab", "Redeem points for a voucher at checkout", "Refer-a-friend link shared from the share sheet", "Push when points are about to expire"],
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    short: "Recurring orders, with shoppers managing them from the app.",
    intro: "Subscribers should not have to log into a website to skip or swap a delivery. Bonsify connects to your subscription app so shoppers can manage frequency, skip, swap and cancel from the app.",
    uses: ["Subscribe-and-save choice on the product screen", "Skip, swap or pause from the Orders tab", "Next-delivery reminders by push", "Subscription discount applied at checkout"],
  },
  {
    id: "bundles",
    title: "Bundles, upsells & recommendations",
    short: "Frequently bought together, bundles and post-purchase offers.",
    intro: "Bigger baskets come from showing the right second product. Bonsify uses the recommendations and bundle rules from your Shopify apps on the product screen, in the cart and after checkout.",
    uses: ["Frequently bought together on the product screen", "Bundle builder that adds the whole set in one tap", "Cart upsells and free-shipping progress", "Product recommendations on the home screen"],
  },
  {
    id: "search",
    title: "Search & personalization",
    short: "Fast search, filters and personalised merchandising.",
    intro: "Search is where intent is highest. Bonsify plugs the search and filter engine you already use into the app, with suggestions as you type and personalised collections on the home screen.",
    uses: ["Instant search with suggestions and recent searches", "Filters and sorting from your search provider", "Personalised home screen and collections", "Visual and AI-assisted product discovery"],
  },
  {
    id: "wishlist",
    title: "Wishlists",
    short: "Save for later, synced with the website.",
    intro: "A wishlist is a built-in reason to come back. Saved products stay in sync between the website and the app, and the app can tell shoppers when a saved item drops in price or returns to stock.",
    uses: ["Heart on every product card", "Wishlist screen synced with the website account", "Back-in-stock and price-drop alerts on saved items", "Share a wishlist with friends"],
  },
  {
    id: "marketing",
    title: "Email, SMS & push",
    short: "Messaging platforms, connected to app events and push.",
    intro: "Your messaging platform already knows your customers. Bonsify sends app events (installs, views, carts, orders) to it, so flows and segments include app behaviour, and push notifications sit next to email and SMS.",
    uses: ["App events and carts sent to your flows", "Push notifications from the same segments as email", "Back-in-stock and abandoned-cart reminders", "Preference centre and opt-in from the app"],
  },
  {
    id: "support",
    title: "Customer support & chat",
    short: "Helpdesk and live chat, one tap from any screen.",
    intro: "Shoppers should reach your team without leaving the app. Bonsify opens your helpdesk or live chat from a floating button, with order context attached so agents see who is writing and what they bought.",
    uses: ["Chat button on every screen, labelled with your store name", "Order and customer details passed to the agent", "Help centre and FAQ articles inside the app", "Quick answers for delivery and returns"],
  },
  {
    id: "payments",
    title: "Payments & checkout",
    short: "Shopify checkout, wallets and buy-now-pay-later.",
    intro: "Checkout stays with Shopify. The app opens Shopify's own Checkout Sheet Kit, so wallets, instalments, discounts and your payment settings work exactly as they do on the web, with no card data in the app.",
    uses: ["Shopify checkout opens in-app, with your payment settings", "Shop Pay, Apple Pay and Google Pay when enabled", "Buy now, pay later options shown on the product", "Address autocomplete and saved details"],
  },
  {
    id: "shipping",
    title: "Shipping, tracking & returns",
    short: "Live tracking, delivery dates and easy returns.",
    intro: "Where is my order is the most common support message. Bonsify shows tracking from your shipping app on the Orders tab, pushes every step, and starts returns in two taps.",
    uses: ["Live tracking on every order", "Push on shipped, out for delivery and delivered", "Estimated delivery date on the product screen", "Start a return or exchange from the order"],
  },
  {
    id: "analytics",
    title: "Analytics, attribution & surveys",
    short: "Know where app orders come from.",
    intro: "A new channel needs measuring. Bonsify sends events to the analytics and attribution tools you already use, so app revenue shows up next to web and ad platforms.",
    uses: ["Screen views, product views and purchases as events", "Install and campaign attribution", "Post-purchase surveys inside the app", "Pixels for Meta, TikTok, Pinterest and Google"],
  },
  {
    id: "video",
    title: "Video, live & shoppable content",
    short: "Shoppable video and live shopping, in the feed.",
    intro: "Video sells what photos cannot. Bonsify plays shoppable videos and live streams from your video app inside the app, with products tagged so a shopper can buy without leaving the clip.",
    uses: ["Shoppable video on the home screen and product pages", "Live shopping events with push reminders", "Creator and UGC video galleries", "Sweepstakes and social campaigns"],
  },
  {
    id: "fit",
    title: "Size, fit & try-on",
    short: "Size guides, fit advice and virtual try-on.",
    intro: "Wrong size is the top reason for returns. Bonsify opens your size or fit tool from the product screen so shoppers pick the right size first time, with try-before-you-buy where you offer it.",
    uses: ["Size guide and recommendation on the product screen", "Virtual try-on and digital fashion", "Try before you buy at checkout", "Fewer size-related returns"],
  },
  {
    id: "store",
    title: "Storefront, languages & compliance",
    short: "Page builders, translation, currencies and consent.",
    intro: "Your store content should not be rebuilt for the app. Bonsify reads your languages, markets and page content, and honours consent and accessibility settings from the tools you already use.",
    uses: ["Languages and currencies from Shopify Markets", "Landing pages from your page builder shown in-app", "Consent and privacy choices respected", "Accessible by default"],
  },
  {
    id: "discounts",
    title: "Discounts & promotions",
    short: "App-only offers and personalised promotions.",
    intro: "An app-only discount is the simplest reason to install. Bonsify applies your discount rules, including offers exclusive to app shoppers, on product pages, in the cart and at checkout.",
    uses: ["App-exclusive discount codes", "Offers by customer segment", "Countdown deals on the home screen", "Automatic discounts in the cart"],
  },
  {
    id: "native",
    title: "Native app features",
    short: "What a real app can do that a website cannot.",
    intro: "These come with the app itself: sign in with one tap, biometric unlock, barcode scanning and more. They are built into every Bonsify app, not bought separately.",
    uses: ["Sign in with Apple, Google or Facebook", "Face ID and fingerprint unlock", "Barcode and QR scanning in store", "Share sheet, deep links and widgets"],
  },
];

// [name, website (for the logo), one line]. Websites left empty show a letter tile.
const RAW = {
  reviews: [
    ["Yotpo Reviews", "yotpo.com", "Ratings, written reviews and photo reviews that build trust on every product."],
    ["Yotpo UGC", "yotpo.com", "Customer photos and videos shown on product pages and in galleries."],
    ["Okendo", "okendo.com", "Reviews, ratings and customer attributes with rich media."],
    ["Judge.me", "judge.me", "Product reviews with photos, videos and questions and answers."],
    ["Loox", "loox.io", "Photo reviews that turn buyers into social proof."],
    ["Stamped Reviews", "stamped.io", "Reviews, ratings and visual user content for Shopify."],
    ["Bazaarvoice", "bazaarvoice.com", "Enterprise reviews, questions and answers, and content syndication."],
    ["Reviews.io", "reviews.io", "Company and product reviews with Google seller ratings."],
    ["Junip", "junip.co", "Product reviews and customer insights built for Shopify."],
    ["Foursixty", "foursixty.com", "Shoppable galleries made from real customer photos."],
    ["Instafeed", "", "Instagram feeds and galleries shown on product pages."],
    ["Trustpilot", "trustpilot.com", "Open reviews platform with star ratings shoppers recognise."],
    ["Trustspot", "trustspot.io", "Reviews, photo reviews and user content for ecommerce."],
    ["Fera", "fera.ai", "Reviews and social proof with photos and video."],
    ["Growave Reviews", "growave.io", "Reviews, ratings and photos from the Growave suite."],
    ["Klaviyo Reviews", "klaviyo.com", "Product reviews collected and shown through Klaviyo."],
  ],
  loyalty: [
    ["Smile.io", "smile.io", "Points, VIP tiers and referrals for repeat customers."],
    ["LoyaltyLion", "loyaltylion.com", "Loyalty programmes that tie rewards to every action."],
    ["Rivo", "rivo.io", "Loyalty, referrals and VIP tiers with a clean setup."],
    ["Yotpo Loyalty & Referrals", "yotpo.com", "Points, tiers and referral rewards inside the Yotpo suite."],
    ["Rise.ai", "rise.ai", "Store credit, gift cards and cashback as rewards."],
    ["Growave", "growave.io", "Loyalty, wishlist, reviews and referrals in one app."],
    ["Inveterate", "inveterate.co", "Loyalty and subscription tools for retention."],
    ["ReferralCandy", "referralcandy.com", "Refer-a-friend programmes with automatic rewards."],
    ["Stamped Loyalty", "stamped.io", "Points and rewards from the Stamped suite."],
    ["Okendo Loyalty", "okendo.com", "Loyalty and rewards from the Okendo suite."],
    ["Joy Loyalty", "joy.so", "Points, tiers and rewards with an easy setup."],
    ["BON Loyalty", "bonloyalty.com", "Points, referrals and VIP tiers for Shopify stores."],
    ["Bubblehouse", "bubblehouse.com", "Loyalty built around brand experiences and perks."],
    ["Talkable", "talkable.com", "Referral and ambassador programmes at scale."],
    ["POPcoins", "popcoins.in", "Wallet and coin rewards for shoppers in India."],
  ],
  subscriptions: [
    ["Recharge", "rechargepayments.com", "The subscription platform for recurring orders on Shopify."],
    ["Skio", "skio.com", "Subscriptions with flexible plans and smooth customer controls."],
    ["Stay Ai", "stay.ai", "Subscriptions focused on retention and churn reduction."],
    ["Loop Subscriptions", "loopwork.co", "Subscription management with shopper self-service."],
    ["Smartrr", "smartrr.com", "Subscriptions that keep the shopper in your store."],
    ["Ordergroove", "ordergroove.com", "Enterprise subscriptions and recurring commerce."],
    ["Awtomic", "awtomic.com", "Simple, flexible subscriptions for Shopify brands."],
    ["Bold Subscriptions", "boldcommerce.com", "Recurring orders and memberships from Bold."],
    ["Appstle Subscriptions", "appstle.com", "Subscriptions, memberships and bundles with a low monthly cost."],
    ["Seal Subscriptions", "sealsubscriptions.com", "Subscribe-and-save with straightforward management."],
    ["PayWhirl", "paywhirl.com", "Subscriptions and recurring payments."],
    ["Yotpo Subscriptions", "yotpo.com", "Subscriptions inside the Yotpo retention suite."],
    ["Shopify Subscriptions", "shopify.com", "Shopify's own app for selling subscriptions."],
    ["Subify", "subify.com", "Subscription management with discounts and plans."],
    ["Recurpay", "recurpay.com", "Recurring payments and subscription plans."],
  ],
  bundles: [
    ["Rebuy", "rebuyengine.com", "Personalisation and cross-sell across the cart and product pages."],
    ["Nosto", "nosto.com", "Product recommendations and personalised merchandising."],
    ["Bold Bundles", "boldcommerce.com", "Bundles and product sets with flexible pricing."],
    ["BOGOS", "bogos.io", "Buy-one-get-one and gift offers that lift order value."],
    ["Kimonix", "kimonix.com", "AI merchandising that ranks products for each shopper."],
    ["AfterSell", "aftersell.com", "Post-purchase upsells and order bumps."],
    ["Shopify Bundles", "shopify.com", "Shopify's own app for creating product bundles."],
    ["Bundle Builder", "", "Let shoppers build their own bundles."],
    ["ReConvert", "reconvert.io", "Thank-you page upsells and post-purchase offers."],
    ["Zipify OneClickUpsell", "zipify.com", "One-click upsells before and after checkout."],
    ["CartHook", "carthook.com", "Checkout and post-purchase offers."],
    ["Selleasy", "selleasy.com", "Upsell and cross-sell popups with discounts."],
    ["Purple Dot", "purpledotprice.com", "Pre-orders and waitlists with automatic updates."],
    ["Frequently Bought Together", "", "Show products that are often bought with the one being viewed."],
    ["Shopify Product Recommendations", "shopify.com", "Native related and complementary product suggestions."],
    ["Wiser", "wiser.ai", "Product recommendations powered by browsing behaviour."],
  ],
  search: [
    ["Algolia", "algolia.com", "Fast, typo-tolerant search and discovery."],
    ["Boost AI Search & Filter", "boostcommerce.net", "Search, filters and merchandising for large catalogues."],
    ["Klevu", "klevu.com", "AI-powered search and discovery for ecommerce."],
    ["Searchspring", "searchspring.com", "Search, merchandising and personalisation."],
    ["Constructor", "constructor.com", "Product discovery that learns from shopper behaviour."],
    ["Octane AI", "octaneai.com", "Quizzes and zero-party data for personalised recommendations."],
    ["Searchanise", "searchanise.com", "Instant search and filters for Shopify stores."],
    ["Doofinder", "doofinder.com", "Search with layers, filters and analytics."],
    ["Fast Simon", "fastsimon.com", "Search, collections and merchandising powered by AI."],
    ["Findify", "findify.io", "Search and recommendations that adapt to each shopper."],
    ["Tagalys", "tagalys.com", "Search, filters and product merchandising."],
    ["Dynamic Yield", "dynamicyield.com", "Personalisation and experience optimisation."],
    ["Bloomreach", "bloomreach.com", "Search and personalisation with commerce data."],
    ["Athos Commerce", "searchspring.com", "Search, merchandising and personalisation (the Searchspring team)."],
    ["Smart Search", "", "Instant search and suggestions for Shopify."],
    ["Shopify Search & Discovery", "shopify.com", "Shopify's own search, filters and product recommendations."],
    ["Zevi", "zevi.ai", "AI search and filters for ecommerce."],
    ["Searchtap", "searchtap.io", "Search and discovery for fashion and lifestyle stores."],
    ["Wizzy.AI", "wizzy.ai", "Search and discovery for Shopify."],
    ["CloudSearch", "", "Fast search and filter service for Shopify stores."],
    ["ViSenze", "visenze.com", "Visual search that finds products from a photo."],
  ],
  wishlist: [
    ["Swish (Wishlist King)", "swish.app", "Wishlists that sync across devices."],
    ["Wishlist Plus by Swym", "swymcorp.com", "Wishlists, back-in-stock alerts and gift registries."],
    ["The Wishlist Company", "", "Wishlists with sharing and reminders."],
    ["Flits Wishlist", "getflits.com", "Wishlist alongside the Flits customer account."],
    ["Growave Wishlist", "growave.io", "Wishlist from the Growave suite."],
  ],
  marketing: [
    ["Klaviyo", "klaviyo.com", "Email and SMS marketing built on your Shopify data."],
    ["Attentive", "attentive.com", "Personalised text message marketing."],
    ["Postscript", "postscript.io", "SMS marketing for Shopify brands."],
    ["Omnisend", "omnisend.com", "Email, SMS and push in one automation platform."],
    ["Mailchimp", "mailchimp.com", "Email marketing and audiences."],
    ["Braze", "braze.com", "Cross-channel customer engagement, including push."],
    ["Listrak", "listrak.com", "Cross-channel messaging for retail."],
    ["Dotdigital", "dotdigital.com", "Email, SMS and omnichannel automation."],
    ["Iterable", "iterable.com", "Cross-channel campaigns with real-time data."],
    ["Ometria", "ometria.com", "Customer data and marketing automation for retail."],
    ["Yotpo SMS & Email", "yotpo.com", "SMS and email inside the Yotpo suite."],
    ["Drip", "drip.com", "Email and SMS for ecommerce brands."],
    ["OneSignal", "onesignal.com", "Push notifications, in-app messages and email."],
    ["Salesforce Marketing Cloud", "salesforce.com", "Enterprise marketing automation."],
    ["Redo", "getredo.com", "Returns, SMS and email in one retention stack."],
    ["MoEngage", "moengage.com", "Push, in-app and email engagement."],
    ["Netcore", "netcorecloud.com", "Customer engagement and messaging."],
    ["WebEngage", "webengage.com", "Push, email and in-app messages for retention."],
    ["Contlo", "contlo.com", "Marketing automation for D2C brands."],
    ["Privy", "privy.com", "Email, SMS and popups that grow your list."],
    ["Avada Email Marketing", "avada.io", "Email and SMS marketing for Shopify."],
    ["Seguno", "seguno.com", "Email campaigns for Shopify stores."],
    ["Rebid", "", "Engagement and push for Shopify stores."],
    ["KwikEngage", "gokwik.co", "Push and WhatsApp engagement from GoKwik."],
    ["Value First", "valuefirst.com", "SMS, WhatsApp and OTP messaging."],
    ["MSG91", "msg91.com", "SMS, OTP and WhatsApp messaging."],
  ],
  support: [
    ["Gorgias", "gorgias.com", "Helpdesk built for ecommerce, with order data beside each ticket."],
    ["Zendesk", "zendesk.com", "Customer service software for tickets and chat."],
    ["Gladly", "gladly.com", "Customer service organised around the person, not the ticket."],
    ["Intercom", "intercom.com", "Chat, help centre and AI support."],
    ["Re:amaze", "reamaze.com", "Helpdesk, live chat and social inbox."],
    ["Kustomer", "kustomer.com", "Customer service with a full view of every shopper."],
    ["Rep AI", "hellorep.ai", "AI sales and support assistant."],
    ["Tidio", "tidio.com", "Live chat and chatbots for online stores."],
    ["Richpanel", "richpanel.com", "Helpdesk with order management and automation."],
    ["Freshdesk", "freshdesk.com", "Helpdesk and ticketing."],
    ["Help Scout", "helpscout.com", "Shared inbox and help centre."],
    ["LiveChat", "livechat.com", "Live chat software for support and sales."],
    ["Zowie", "getzowie.com", "AI customer service for ecommerce."],
    ["Kapture", "kapturecrm.com", "Customer support and CRM."],
    ["Trust Signal", "", "Verification and trust messaging for orders."],
  ],
  payments: [
    ["Shop Pay", "shop.app", "Shopify's fast, saved-details checkout."],
    ["Apple Pay", "apple.com", "One-tap payment with Face ID."],
    ["Google Pay", "pay.google.com", "One-tap payment on Android."],
    ["Klarna", "klarna.com", "Pay later and in instalments."],
    ["Afterpay", "afterpay.com", "Buy now, pay in four."],
    ["Affirm", "affirm.com", "Simple monthly payments at checkout."],
    ["Sezzle", "sezzle.com", "Interest-free payments in four."],
    ["Zip", "zip.co", "Buy now, pay later."],
    ["PayPal", "paypal.com", "Pay with PayPal at checkout."],
    ["Stripe", "stripe.com", "Payment processing behind Shopify Payments."],
    ["Bolt", "bolt.com", "One-click checkout with saved details."],
    ["Global-e", "global-e.com", "Cross-border checkout, duties and local payments."],
    ["Address Autocomplete", "", "Suggests addresses as shoppers type, so deliveries are accurate."],
    ["EcoCart", "ecocart.io", "Carbon-neutral shipping offered at checkout."],
    ["Shopflo", "shopflo.com", "High-conversion checkout for Shopify."],
    ["KwikPass", "gokwik.co", "One-tap login and checkout for shoppers."],
    ["Shopify Checkout", "shopify.com", "Shopify's own checkout, opened with the Checkout Sheet Kit."],
    ["Google Places API", "developers.google.com", "Address search and verification."],
  ],
  shipping: [
    ["AfterShip", "aftership.com", "Order tracking and branded delivery updates."],
    ["Narvar", "narvar.com", "Tracking and returns for large retailers."],
    ["Malomo", "gomalomo.com", "Branded tracking pages and shipment updates."],
    ["Route", "route.com", "Package protection and tracking."],
    ["Loop Returns", "loopreturns.com", "Returns and exchanges that keep revenue."],
    ["Happy Returns", "happyreturns.com", "In-person and mailed returns."],
    ["ReturnGO", "returngo.ai", "Returns and exchanges automation."],
    ["ReturnLogic", "returnlogic.com", "Returns that recover revenue."],
    ["ShipBob", "shipbob.com", "Fulfilment and shipping."],
    ["ShipStation", "shipstation.com", "Shipping labels and fulfilment."],
    ["Sorted", "sorted.com", "Delivery experience and shipment management."],
    ["Parcel Panel", "parcelpanel.com", "Order tracking and delivery notifications."],
    ["LyveCom", "lyvecom.com", "Order tracking and delivery notifications."],
    ["Order Protection", "", "Protects orders against loss, damage and theft."],
    ["Shiprocket", "shiprocket.in", "Shipping and delivery estimates for India."],
    ["Eco Returns", "", "Returns with low-carbon options."],
    ["Return Prime", "returnprime.com", "Returns, exchanges and refunds."],
    ["Yagi Cancellable", "", "Lets shoppers cancel orders after placing them."],
  ],
  analytics: [
    ["Google Analytics 4", "analytics.google.com", "Web and app analytics from Google."],
    ["Firebase Analytics", "firebase.google.com", "App analytics and events."],
    ["Triple Whale", "triplewhale.com", "Ad attribution and store metrics in one dashboard."],
    ["Elevar", "getelevar.com", "Accurate server-side tracking and data layers."],
    ["Northbeam", "northbeam.io", "Marketing attribution and performance."],
    ["Littledata", "littledata.io", "Analytics tracking and subscription metrics."],
    ["Fairing", "fairing.co", "Post-purchase surveys for better attribution."],
    ["KnoCommerce", "knocommerce.com", "Post-purchase surveys and quizzes that show what drives sales."],
    ["Hotjar", "hotjar.com", "Heatmaps and session insights."],
    ["Microsoft Clarity", "clarity.microsoft.com", "Free session recordings and heatmaps."],
    ["Heap", "heap.io", "Automatic product analytics."],
    ["AppsFlyer", "appsflyer.com", "Mobile attribution and measurement."],
    ["Adjust", "adjust.com", "Mobile measurement and fraud prevention."],
    ["Branch", "branch.io", "Deep links and mobile attribution."],
    ["Google Tag Manager", "tagmanager.google.com", "Tags and pixels managed in one place."],
    ["Meta Pixel", "facebook.com", "Measure ads and build audiences on Meta."],
    ["TikTok Pixel", "tiktok.com", "Measure and optimise TikTok ads."],
    ["Pinterest Tag", "pinterest.com", "Measure and optimise Pinterest ads."],
    ["Justuno", "justuno.com", "Popups and onsite messaging that convert."],
    ["Digioh", "digioh.com", "Onsite messaging and data capture."],
    ["UXCam", "uxcam.com", "Mobile app session replays and analytics."],
    ["Google Ads", "ads.google.com", "Conversion tracking for Google campaigns."],
    ["DeltaX", "deltax.com", "Ad management and attribution."],
  ],
  video: [
    ["Tolstoy", "gotolstoy.com", "Shoppable videos and interactive stories."],
    ["Firework", "firework.com", "Shoppable video and live streaming."],
    ["Videowise", "videowise.com", "Shoppable video and UGC for ecommerce."],
    ["Smartzer", "smartzer.com", "Interactive and shoppable video."],
    ["LiveMeUp", "livemeup.com", "Live shopping events."],
    ["Influence.io", "influence.io", "Influencer and creator content."],
    ["CreatorCommerce", "", "Creator-led shopping experiences."],
    ["Shared Sweeps", "", "Sweepstakes and giveaways that grow your list."],
    ["Sauce", "", "Social shopping and video commerce."],
    ["StorifyMe", "storifyme.com", "Story-style content for product discovery."],
  ],
  fit: [
    ["TrueFit", "truefit.com", "Size and fit recommendations that cut returns."],
    ["Wair", "wair.ai", "Fit technology and size recommendations."],
    ["Swapt", "swapt.com", "Virtual fitting for apparel."],
    ["DressX", "dressx.com", "Digital fashion and virtual try-on."],
    ["Mirra", "", "Try before you buy."],
    ["Kiwi Sizing", "kiwisizing.com", "Size charts and recommendations."],
    ["BF Size Chart", "", "Size charts for Shopify products."],
    ["Zakeke", "zakeke.com", "Product customisation and 3D."],
  ],
  store: [
    ["Shopify Markets", "shopify.com", "Sell in multiple countries, currencies and languages."],
    ["Weglot", "weglot.com", "Website translation."],
    ["PageFly", "pagefly.io", "Landing page builder."],
    ["Shogun", "getshogun.com", "Page builder and storefront tools."],
    ["Replo", "replo.app", "Landing pages for ecommerce."],
    ["GemPages", "gempages.net", "Page builder for Shopify."],
    ["LayoutHub", "layouthub.com", "Page builder with templates."],
    ["EComposer", "ecomposer.io", "Landing page builder for Shopify."],
    ["Zipify Pages", "zipify.com", "Landing pages that convert."],
    ["accessiBe", "accessibe.com", "Accessibility tools for compliance."],
    ["Consentmo", "consentmo.com", "Cookie consent and privacy."],
    ["OneTrust", "onetrust.com", "Consent and privacy management."],
    ["Langify", "langify-app.com", "Store translation."],
    ["LangShop", "langshop.io", "Store translation."],
    ["Transcy", "transcy.io", "Translation and currency conversion."],
    ["Shopify Translate & Adapt", "shopify.com", "Shopify's own translation app."],
  ],
  discounts: [
    ["Abra", "abrapromotions.com", "App-exclusive and segment-based discounts shown across the store."],
    ["Shopify Discounts", "shopify.com", "Automatic and code discounts from Shopify."],
  ],
  native: [
    ["Sign in with Apple", "apple.com", "One-tap sign in with Face ID."],
    ["Sign in with Google", "google.com", "One-tap sign in with a Google account."],
    ["Sign in with Facebook", "facebook.com", "Sign in with a Facebook account."],
    ["Face ID", "apple.com", "Biometric unlock for saved accounts."],
    ["Barcode / QR scanner", "", "Scan products and codes with the camera."],
    ["Facebook", "facebook.com", "Facebook SDK for events and sharing."],
  ],
};

const slugify = (n) =>
  n
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// One record per app. An app listed in several groups keeps its first group as
// the primary one and appears in the others too.
const byName = new Map();
for (const c of CATEGORIES) {
  for (const [name, site, line] of RAW[c.id] || []) {
    const key = name.toLowerCase();
    const found = byName.get(key);
    if (found) {
      if (!found.groups.includes(c.id)) found.groups.push(c.id);
    } else byName.set(key, { name, slug: slugify(name), site, line, groups: [c.id] });
  }
}
// Apps that belong to more than one group.
const ALSO = { "Yotpo Reviews": ["loyalty"], Okendo: ["loyalty"], Growave: ["wishlist", "reviews"], Redo: ["shipping"], "Octane AI": ["analytics"], "Stay Ai": ["loyalty"], Rebuy: ["search"], Nosto: ["search"], Route: ["shipping"] };
for (const [n, gs] of Object.entries(ALSO)) {
  const a = byName.get(n.toLowerCase());
  if (a) for (const g of gs) if (!a.groups.includes(g)) a.groups.push(g);
}

export const APPS = [...byName.values()];

export const INTEGRATION_GROUPS = CATEGORIES.map((c) => ({
  ...c,
  apps: APPS.filter((a) => a.groups.includes(c.id)).map((a) => a.name),
}));

export const INTEGRATION_COUNT = APPS.length;

export const appBySlug = (slug) => APPS.find((a) => a.slug === slug);
export const categoryById = (id) => CATEGORIES.find((c) => c.id === id);
export const appsInCategory = (id) => APPS.filter((a) => a.groups.includes(id));
export const primaryCategory = (a) => categoryById(a.groups[0]);

export const shopifySearchUrl = (a) => `https://apps.shopify.com/search?q=${encodeURIComponent(a.name)}`;
export const logoUrl = (a) => (a.site ? `https://www.google.com/s2/favicons?domain=${a.site}&sz=128` : null);

export function integrationsByStoreApps(names = []) {
  const wanted = names.map((n) => n.toLowerCase());
  const out = [];
  for (const a of APPS) {
    const l = a.name.toLowerCase();
    if (wanted.some((w) => l.includes(w) || w.includes(l))) out.push(a.name);
  }
  return out;
}
