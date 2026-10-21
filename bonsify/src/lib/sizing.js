// Size charts and the "find my size" maths for the sample size guide.
// These are typical fits, not a brand's own chart, and the app says so.

export const APPAREL = [
  { size: "XS", chest: [82, 87], waist: [66, 71] },
  { size: "S", chest: [88, 95], waist: [72, 79] },
  { size: "M", chest: [96, 103], waist: [80, 87] },
  { size: "L", chest: [104, 111], waist: [88, 95] },
  { size: "XL", chest: [112, 119], waist: [96, 103] },
  { size: "XXL", chest: [120, 127], waist: [104, 111] },
];

export function apparelSize({ height, weight, fit }) {
  const h = Number(height);
  const w = Number(weight);
  if (!(h > 100 && h < 230 && w > 25 && w < 250)) return null;
  const bmi = w / ((h / 100) ** 2);
  let i = bmi < 18.5 ? 0 : bmi < 21.5 ? 1 : bmi < 24.5 ? 2 : bmi < 27.5 ? 3 : bmi < 31 ? 4 : 5;
  if (h >= 185) i += 1;
  if (h <= 160) i -= 1;
  if (fit === "snug") i -= 1;
  if (fit === "loose") i += 1;
  i = Math.max(0, Math.min(APPAREL.length - 1, i));
  return { size: APPAREL[i].size, row: APPAREL[i], note: `Based on ${Math.round(h)} cm, ${Math.round(w)} kg and a ${fit || "regular"} fit.` };
}

// Paris point: EU size is about 1.5 times (foot length + 1 cm of room).
export const euFromFoot = (cm) => Math.round((Number(cm) + 1) * 1.5 * 2) / 2;
export const SHOES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46].map((eu) => ({
  eu,
  uk: eu - 33,
  us: eu - 32,
  usw: eu - 30.5,
  cm: Math.round((eu / 1.5 - 1) * 10) / 10,
}));

export function shoeSize({ foot }) {
  const f = Number(foot);
  if (!(f >= 20 && f <= 33)) return null;
  const eu = euFromFoot(f);
  const row = SHOES.reduce((a, b) => (Math.abs(b.eu - eu) < Math.abs(a.eu - eu) ? b : a));
  return { size: String(eu % 1 ? eu : eu), eu, row, note: `A ${f} cm foot is about EU ${eu}. If you are between sizes, go up.` };
}

export const KIDS = [
  ["0-3 months", "0-3M", 56],
  ["3-6 months", "3-6M", 62],
  ["6-12 months", "6-12M", 74],
  ["1-2 years", "1-2Y", 86],
  ["2-3 years", "2-3Y", 94],
  ["3-4 years", "3-4Y", 102],
  ["4-5 years", "4-5Y", 108],
  ["5-6 years", "5-6Y", 114],
  ["7-8 years", "7-8Y", 128],
  ["9-10 years", "9-10Y", 140],
  ["11-12 years", "11-12Y", 152],
].map(([age, size, height]) => ({ age, size, height }));

export function kidsSize({ months, height }) {
  const m = Number(months);
  const h = Number(height);
  if (h > 40 && h < 190) {
    const row = KIDS.reduce((a, b) => (Math.abs(b.height - h) < Math.abs(a.height - h) ? b : a));
    // Go up a size when the child is between sizes.
    const k = KIDS.indexOf(row);
    const up = h > row.height + 3 && k < KIDS.length - 1 ? KIDS[k + 1] : row;
    return { size: up.size, row: up, note: `${Math.round(h)} cm fits ${row.size}${up !== row ? ", and a little room to grow takes it up one." : "."}` };
  }
  if (m >= 0 && m <= 156) {
    const row = KIDS.find((k) => {
      const hi = { "0-3M": 3, "3-6M": 6, "6-12M": 12, "1-2Y": 24, "2-3Y": 36, "3-4Y": 48, "4-5Y": 60, "5-6Y": 72, "7-8Y": 96, "9-10Y": 120, "11-12Y": 144 }[k.size];
      return m <= hi;
    }) || KIDS[KIDS.length - 1];
    return { size: row.size, row, note: `For ${m} months, ${row.size} fits. Kids grow fast, so size up if in doubt.` };
  }
  return null;
}

export const RINGS = [
  { us: 5, uk: "J 1/2", eu: 49, mm: 15.7 },
  { us: 6, uk: "L 1/2", eu: 52, mm: 16.5 },
  { us: 7, uk: "N 1/2", eu: 54, mm: 17.3 },
  { us: 8, uk: "P 1/2", eu: 57, mm: 18.1 },
  { us: 9, uk: "R 1/2", eu: 59, mm: 18.9 },
  { us: 10, uk: "T 1/2", eu: 62, mm: 19.8 },
];

export function ringSize({ circ }) {
  const c = Number(circ);
  if (!(c >= 44 && c <= 68)) return null;
  const row = RINGS.reduce((a, b) => (Math.abs(b.eu - c) < Math.abs(a.eu - c) ? b : a));
  return { size: String(row.us), row, note: `A finger of ${c} mm around is about US ${row.us}. Measure at the end of the day, when fingers are largest.` };
}
