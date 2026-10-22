"use client";

// Small tap feedback on phones that support it; silently skipped elsewhere.
// Pulses under about 15 ms are not felt on many Android phones.
export const buzz = (ms = 16) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {}
};

export const Icon = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  bag: <path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0" />,
  search: <path d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm10 3-5-5" />,
  bell: <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zm4 4h4" />,
  back: <path d="M15 5 8 12l7 7" />,
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  gift: <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" />,
  heartFill: <path fill="currentColor" d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  truck: <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  share: <path d="M12 4v11M8 8l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />,
  star: <path fill="currentColor" stroke="none" d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8z" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2" />,
  pin: <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10zm0-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />,
  chev: <path d="m9 5 7 7-7 7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  tag: <path d="M3 12V4h8l10 10-8 8zM7.5 8.5h.01" />,
  box: <path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" />,
  ruler: <path d="M3 17 17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  store: <path d="M4 9 5.5 4h13L20 9M4 9h16M4 9v11h16V9M9 20v-6h6v6" />,
  card: <path d="M3 6h18v12H3zM3 10h18M7 15h4" />,
  wallet: <path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1zM4 7V6a2 2 0 0 1 2-2h11M16 13.5h.01" />,
  cash: <path d="M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6.5 10v.01M17.5 14v.01" />,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  sort: <path d="M8 4v16M8 20l-3-3M8 20l3-3M16 20V4M16 4l-3 3M16 4l3 3" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6.5 6.5 0 0 1 3.5 6" />,
  crown: <path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z" />,
  bellFill: <path fill="currentColor" d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zm4 4h4" />,
  copy: <path d="M9 9h11v11H9zM5 15V4h11" />,
  phone: <path d="M6 3h4l1.5 4.5L9 9a11 11 0 0 0 6 6l1.5-2.5L21 14v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" />,
  send: <path d="M4 12 20 4l-4 16-4-6z" />,
  trophy: <path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 20h8" />,
};

export function Svg({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {Icon[name]}
    </svg>
  );
}

