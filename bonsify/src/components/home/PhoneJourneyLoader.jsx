"use client";

import dynamic from "next/dynamic";

// next/dynamic's ssr:false isn't allowed directly inside a Server Component
// (layout.js, which renders this, has no client runtime to skip SSR for) -
// this thin client wrapper gives it one. See PhoneJourney.jsx for why
// deferring it this way is safe (it already renders null on the server).
const PhoneJourney = dynamic(() => import("./PhoneJourney"), { ssr: false });

export default function PhoneJourneyLoader(props) {
  return <PhoneJourney {...props} />;
}
