"use client";
import { useEffect, useRef } from "react";
import BrandApp from "@/components/proposals/BrandApp";
export default function RecApp({ brand }) {
  const ref = useRef(null);
  useEffect(() => { window.__app = ref; }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#fff", overflow: "hidden" }}>
      <BrandApp ref={ref} brand={brand} liveReviews />
    </div>
  );
}
