# Bonsify lab site

An interactive copy of the home page that runs as its own Vercel project
(`bonsify-lab`), so the main site and bonsify.io are never touched.

## How it is switched on

- `NEXT_PUBLIC_LAB=1` (set only on the `bonsify-lab` project) makes `/` render
  the lab home, hides the normal header and footer on `/`, adds
  `X-Robots-Tag: noindex` to every page and turns on `/api/demo`.
- Without that variable (the main site) nothing changes, except a hidden
  `/lab` page that shows the same experience (noindex).
- Every other page (`/work`, `/services`, `/contact` and so on) is the normal
  site, so the lab is a full site you can click around.
- Contact messages sent from the lab are tagged `[Bonsify lab]` in the inbox.

## Deploying it

`bonsify-lab` builds only the `lab` branch. From the repo root:

```
git checkout -b lab
git add -A
git commit -m "Lab site and app polish"
git push -u origin lab
```

Vercel then builds it and gives a URL like `bonsify-lab-git-lab-bonsify.vercel.app`.
The same commit can later be merged into `main` to put the app polish on the
real site (the lab home stays off there).

## Parts

- `src/components/lab/LabHome.jsx` and `.module.css`: the page. One fixed
  phone, seven chapters, a colour wipe from the phone on each chapter, floating
  pieces that fly out of the phone, cursor tilt, gyroscope tilt on phones,
  haptics (Android only, iPhone does not allow web vibration), cursor ring.
- `src/lib/lab.js`: the stores in the brand switcher (Highfy from the proposal
  file, others from `content/lab/*.json`).
- `src/app/api/demo/route.js`: "type your store". Reads the public store pages
  and returns a small brand record. Needs the Turnstile check, limited to 4 per
  visitor per 10 minutes and 80 per hour per instance, and runs up to 60 s.
- `public/lab/phone-<store>.glb`: the 3D phone used for AR. On phones the hero
  shows an "Imagine it in your hands" button that opens AR directly (WebXR or
  Scene Viewer on Android, Quick Look on iPhone). Typed stores get their own
  screen drawn in the browser (`src/lib/arTexture.js`). The viewer script loads
  from jsDelivr only on touch devices, after the page settles.
- Phones also get a "Full screen" button that opens the app edge to edge.
- On desktop, one wheel or trackpad gesture moves exactly one section (the app
  inside the phone scrolls first when the pointer is over it).

## Adding a store to the switcher

```
node -e "import('./scripts/lib/brand-record.mjs').then(async m=>{const b=await m.buildRemoteBrand('https://store.com',{});require('fs').writeFileSync('content/lab/store.json',JSON.stringify(b))})"
```

Then capture its phone screen, build a `phone-store.glb` the same way as the
others, and add the slug to the AR picker if wanted.

## Store category engine

`src/lib/storeProfile.js` decides which app features a store gets from what it sells (product types, titles, descriptions, collections, brand name), never from features its website has. `brand.category` overrides it.

| Feature | Who gets it |
| --- | --- |
| Rewards tiers, referral, gift cards and gift note, saved cards and wallets, recent and trending searches, filter and sort, price and stock alerts, chat button | Every store |
| Size guide and find-my-size | Fashion (apparel chart), footwear (shoe), kids (age and height), jewellery that sells rings or bangles (ring). Sports only if it sells wearable kit |
| Complete the look (heading changes: look, routine, room, set, style it with) | Fashion, footwear, beauty, jewellery, home, kids. Not electronics, food, health, pets, books, sports, general |
| Store locator and click and collect | Every physical-goods category except "general" |
| Cash on delivery, WhatsApp button, miles instead of km | Market rules from currency and domain (PKR, INR, AED, SAR and similar), not category |
