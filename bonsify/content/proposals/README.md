# Proposal pages (bonsify.io/for/&lt;brand&gt;)

Each JSON file in this folder becomes a private proposal page at
`/for/<slug>` on the next deploy. Pages are `noindex` and left out of the
sitemap, so only people you send the link to will see them.

## Add a brand

From the `bonsify` folder:

```
npm run add-brand -- https://www.highfy.pk --name Highfy --contact Ali
```

- `--name` sets the brand name shown on the page (otherwise taken from the site).
- `--slug` sets the URL part (otherwise made from the name).
- `--contact` puts "Prepared for Ali and the Highfy team" on the cover.

The script saves the logo, banners and product images to
`public/proposals/<slug>/` and writes `content/proposals/<slug>.json`.
Check the warnings it prints, preview with `npm run dev` at
`http://localhost:3000/for/<slug>`, then commit and push to deploy.

## Fix anything by hand

Put corrections under `"overrides"` in the brand file. They win over the
crawled values and survive a re-crawl. For example:

```json
"overrides": {
  "name": "Highfy",
  "contact": "Ali",
  "colors": { "primary": "#781890", "accent": "#ff9048" },
  "date": "2026-10-21"
}
```

## What the page has

- **Proposal**: a 7-slide deck filled in from the brand's store data.
- **Our apps**: our shipped apps (from `src/lib/showcase.js`, following the
  visibility switches in `src/lib/clients.js`).
- **Your app**: a working app preview themed with the brand's logo,
  colours, fonts and products.

Deep links: `/for/<slug>?tab=app`, `?tab=apps&app=highfy&screen=2`,
`?tab=deck&slide=plan`. Slide ids: cover, today, why, plan, work, process, next.

## Notes

- Shopify limits its public product feed by IP. If a crawl says products
  came from the sitemap without prices, wait a few minutes and run it again.
- Files starting with `_` are ignored, so `_draft.json` won't build a page.
