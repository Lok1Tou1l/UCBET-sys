/** Deterministic pseudo-random helpers so demo data is stable between reloads. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed = 2026) {
  const next = mulberry32(seed);
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
    /** weighted pick: [[value, weight], ...] */
    weighted: <T,>(pairs: readonly (readonly [T, number])[]): T => {
      const total = pairs.reduce((s, p) => s + p[1], 0);
      let r = next() * total;
      for (const [v, w] of pairs) {
        if ((r -= w) <= 0) return v;
      }
      return pairs[pairs.length - 1][0];
    },
    shuffle: <T,>(arr: readonly T[]): T[] => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

/** ISO timestamp n days (and optional hours) before now – keeps demo data looking "recent". */
export function daysAgo(n: number, hour = 9, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function daysFromNow(n: number): string {
  return daysAgo(-n);
}

/** yyyy-mm-dd */
export const isoDate = (iso: string) => iso.slice(0, 10);

let counter = 1000;
export const nextId = (prefix: string) => `${prefix}-${++counter}`;

export function currentAcademicYear(date = new Date()): string {
  const y = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${y}/${y + 1}`;
}

/** Last `count` academic years, newest first. */
export function academicYears(count = 5): string[] {
  const start = Number(currentAcademicYear().slice(0, 4));
  return Array.from({ length: count }, (_, i) => `${start - i}/${start - i + 1}`);
}
