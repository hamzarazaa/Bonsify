# Video engine

Makes a personalised app walkthrough for a prospect: your recorded intro, a demo
narrated by your spokesperson's cloned voice over the live app, your recorded outro.
No avatar service. Only the demo narration costs anything per video.

## One-time setup

1. Record `assets/intro.mp4` (15 to 20 s) and `assets/outro.mp4` (5 to 10 s). See RECORDING.md.
2. Clone the voice in ElevenLabs (Instant Voice Clone, about 2 minutes of clean audio). Copy the voice ID.
3. Environment (never commit these):
   - `VOICE_ID`, the cloned voice's ID
   - `ELEVENLABS_API_KEY` (direct, default) or `OPENROUTER_API_KEY` with `--provider openrouter`
   - `TTS_MODEL` if you want a different model (default `eleven_v4_turbo` direct, `elevenlabs/eleven-v4-turbo` on OpenRouter). Check the exact model ID in the ElevenLabs docs.
4. `npm i -D playwright` (and `npx playwright install chromium` if there is no Chromium).

## Per video

```
npm run build && REC_ROUTE=1 NEXT_PUBLIC_LAB=1 npm start -- -p 3100   # the app, with the recording page on
node video/engine.mjs <slug>                                           # writes video/out/<slug>.mp4, .vtt, -poster.jpg
node video/engine.mjs <slug> --dry                                     # same, with silence for the voice, costs nothing
```

`<slug>` is a brand file in `content/lab/` (run `npm run add-brand` first for a new prospect).

## How it works

- `script.mjs` writes the narration and the phone actions from the brand file (name, categories, first product). Edit the wording there.
- Each scene is spoken on its own and cached by text in `cache/`, so a re-run only pays for scenes whose text changed.
- The app is recorded for exactly as long as each scene is spoken, so voice and screen always match.
- The frame has a caption per sentence, a progress bar and a "Made for <brand>" tag on the intro.
- `/rec/<slug>` is the recording page. It returns 404 unless the server starts with `REC_ROUTE=1`.

## Cost

Characters spoken times the model rate. Eleven v4 Turbo is $40 per million characters, so a 2 minute demo of about 1,900 characters is about $0.08.
