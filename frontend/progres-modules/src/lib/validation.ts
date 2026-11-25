/**
 * Lightweight form validation.
 *
 * const errors = validate(values, {
 *   title: [required(), maxLen(120)],
 *   endDate: [required(), dateOnOrAfter('startDate')],
 * }, t);
 *
 * Returns a map field -> translated message (empty object when valid).
 */
export type Translate = (key: string, vars?: Record<string, string | number>) => string;
export type RuleResult = { key: string; vars?: Record<string, string | number> } | undefined;
export type Rule<V = Record<string, any>> = (value: any, values: V) => RuleResult;

const isEmpty = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

export const required = (): Rule => (v) => (isEmpty(v) ? { key: 'validation.required' } : undefined);

export const minLen = (n: number): Rule => (v) =>
  !isEmpty(v) && String(v).trim().length < n ? { key: 'validation.minLen', vars: { n } } : undefined;

export const maxLen = (n: number): Rule => (v) =>
  !isEmpty(v) && String(v).length > n ? { key: 'validation.maxLen', vars: { n } } : undefined;

export const email = (): Rule => (v) =>
  !isEmpty(v) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v)) ? { key: 'validation.email' } : undefined;

export const phone = (): Rule => (v) =>
  !isEmpty(v) && !/^[+\d][\d\s().-]{7,18}$/.test(String(v)) ? { key: 'validation.phone' } : undefined;

export const numberBetween = (min: number, max: number): Rule => (v) => {
  if (isEmpty(v)) return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return { key: 'validation.number' };
  if (n < min || n > max) return { key: 'validation.range', vars: { min, max } };
  return undefined;
};

export const positiveNumber = (): Rule => (v) => {
  if (isEmpty(v)) return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return { key: 'validation.number' };
  return n < 0 ? { key: 'validation.positive' } : undefined;
};

export const dateOnOrAfter = (otherField: string): Rule => (v, values: any) => {
  if (isEmpty(v) || isEmpty(values[otherField])) return undefined;
  return new Date(v) < new Date(values[otherField]) ? { key: 'validation.dateAfter' } : undefined;
};

export const dateNotInFuture = (): Rule => (v) => {
  if (isEmpty(v)) return undefined;
  return new Date(v) > new Date() ? { key: 'validation.dateFuture' } : undefined;
};

export function validate<V extends Record<string, any>>(
  values: V,
  rules: Partial<Record<keyof V & string, Rule<V>[]>>,
  t: Translate,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of Object.keys(rules)) {
    for (const rule of rules[field as keyof V & string] ?? []) {
      const res = rule(values[field], values);
      if (res) {
        errors[field] = t(res.key, res.vars);
        break;
      }
    }
  }
  return errors;
}

export const hasErrors = (e: Record<string, string>) => Object.keys(e).length > 0;

/** File upload validation shared by document upload widgets. */
export interface FileRules {
  accept?: string[]; // mime types or extensions like ".pdf"
  maxSizeMB?: number;
}
export function validateFile(file: File, rules: FileRules, t: Translate): string | undefined {
  if (rules.maxSizeMB && file.size > rules.maxSizeMB * 1024 * 1024) {
    return t('upload.tooLarge', { name: file.name, n: rules.maxSizeMB });
  }
  if (rules.accept?.length) {
    const ext = '.' + (file.name.split('.').pop() ?? '').toLowerCase();
    const ok = rules.accept.some((a) => (a.startsWith('.') ? a.toLowerCase() === ext : a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a));
    if (!ok) return t('upload.badType', { name: file.name });
  }
  if (file.size === 0) return t('upload.empty', { name: file.name });
  return undefined;
}
