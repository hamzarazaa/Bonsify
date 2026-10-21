"use client";

import { useEffect, useRef, useState } from "react";
import BonsifyLoader from "./BonsifyLoader";
import styles from "./LivePrototype.module.css";

// Figma draws the prototype frame with about 64px of padding around it,
// even with its UI hidden. So the iframe is made the frame's size plus that
// padding, then scaled and centred so the frame alone fills the phone screen
// (390 x 844), cropping a few pixels at the edges rather than showing a border.
const SCREEN_W = 390;
const SCREEN_H = 844;
const PAD = 64;
function cropStyle([fw, fh] = [SCREEN_W, SCREEN_H]) {
  const k = Math.max(SCREEN_W / fw, SCREEN_H / fh) * 1.03;
  return {
    width: fw + PAD * 2,
    height: fh + PAD * 2,
    left: SCREEN_W / 2 - (PAD + fw / 2) * k,
    top: SCREEN_H / 2 - (PAD + fh / 2) * k,
    transform: `scale(${k})`,
  };
}

// A clickable Figma prototype filling a <Phone> screen. The Bonsify loader
// covers it until Figma has drawn the first screen. Changing `run` reloads it
// from the start. Used in proposals ("Our apps") and on the case study pages.
export default function LivePrototype({ app, shown = true, run = 0 }) {
  const frameRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    let timer;
    const onMessage = (e) => {
      if (e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === "PRESENTED_NODE_CHANGED") setReady(true);
    };
    window.addEventListener("message", onMessage);
    // Without an Embed API key Figma doesn't send load events, so fall back
    // to a short wait after the frame itself has loaded.
    const frame = frameRef.current;
    const onLoad = () => {
      timer = setTimeout(() => setReady(true), 7000);
    };
    frame?.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("message", onMessage);
      frame?.removeEventListener("load", onLoad);
      clearTimeout(timer);
    };
  }, [run]);

  return (
    <div className={styles.live} hidden={!shown} style={{ "--app": app.color }}>
      {!ready && <BonsifyLoader label={`Opening ${app.name}`} />}
      <iframe
        key={run}
        ref={frameRef}
        src={app.prototype}
        title={`${app.name} app, clickable prototype`}
        className={`${styles.frame} ${ready ? styles.frameOn : ""}`}
        style={cropStyle(app.protoSize)}
        allow="clipboard-write"
      />
    </div>
  );
}
