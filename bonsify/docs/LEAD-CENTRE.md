# Lead Centre: plan and sprint log

Owner of delivery: Claude (PM, design, build, QA). Feedback: Hamza.
Branch: `lab`. Preview on Vercel (bonsify-lab). Nothing reaches `main` or bonsify.io until Hamza says so.

## Goal
A lead CRM inside the Bonsify admin. Add a lead with one button, bulk paste or CSV, see leads as a table or a board,
and have the page, deck and video made automatically. The Google Sheet feed from the site forms stays alive.

## Decisions
- Lives in the Bonsify Next.js app at /admin-side route, same GitLab login as the CMS. A "Leads" link sits in /admin.
- Data store: Firestore (Native mode) in Google project bonsify-engine, free tier. Site forms keep writing to the Google Sheet and also create leads.
- Stages: Open, Contacted, Follow up, Meeting set, Converted, On hold, Dead / DNR.
- Sources: Self-added, Homepage enquiry, Contact page, Import.
- Engine runs in two phases: deck and page first (live in about 2 minutes), video later (tab appears on finish).

## Sprints (each ends with something Hamza can open and click)
- Sprint 0, foundation: mockup, plan, deploy path to a lab preview, Firestore set up. Exit: mockup approved, a lab preview URL works.
- Sprint 1, core: lead data model, API, table view, add one lead (+ button), edit stage and fields in place, detail panel. Exit: Hamza can add and edit leads on the lab preview.
- Sprint 2, views and bulk: board with drag between stages, sort and filter on every field, saved views, paste a list, CSV upload with duplicate check.
- Sprint 3, engine: add lead starts the engine, two-phase job, status written back to the lead, links to page, deck and video on the lead.
- Sprint 4, intake and history: homepage enquiry and contact page create leads (Sheet stays), notes and activity timeline, owners, follow-up dates.
- Sprint 5, polish and release: mobile layout, keyboard use, empty and error states, load test with 500 leads, security review, QA pass, then merge to main on Hamza's word.

## QA rules for every sprint
Unit tests on data rules, API tests (auth, bad input, duplicates), a browser run through the main flow on the lab preview with screenshots, accessibility check (labels, contrast, keyboard), and a regression check that the public site and /admin still work.

## Sprint log
- Sprint 0: started 2026-10-29. Mockup done (Claude Design canvas). Plan written.
