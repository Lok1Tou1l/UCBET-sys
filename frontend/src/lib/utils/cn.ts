export type ClassValue = string | false | null | undefined | 0;

/** Tiny className joiner (same contract as progres-modules/src/lib/utils.ts). */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
