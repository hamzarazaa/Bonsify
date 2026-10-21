"use client";

import { useEffect, useState } from "react";

// Draws a QR code for `value` in the browser (no image file, no network).
export default function QrCode({ value, size = 168, dark = "#0d0f11", light = "#ffffff", label = "QR code", className }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let dead = false;
    if (!value) return;
    import("qrcode")
      .then((m) => (m.default || m).toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark, light } }))
      .then((s) => !dead && setSvg(s))
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [value, dark, light]);
  return (
    <div
      className={className}
      role="img"
      aria-label={label}
      style={{ width: size, height: size, background: light, borderRadius: 12, overflow: "hidden", lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", `<svg width="${size}" height="${size}" `) }}
    />
  );
}
