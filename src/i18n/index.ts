import { fr } from './fr';

export type LocaleKey = 'fr';

let currentLocale: LocaleKey = 'fr';

const dictionaries = {
  fr,
};

type DeepLeaves<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | (T[K] extends object ? `${K}.${DeepLeaves<T[K]>}` : never)
        : never;
    }[keyof T]
  : never;

type TranslationPaths = DeepLeaves<typeof fr>;

/**
 * Pure function to extract translation.
 * Usage: t('common.save')
 * Supports dynamic replacement if 'params' are provided (e.g. { name: 'John' })
 */
export const t = (path: TranslationPaths, params?: Record<string, string | number>): string => {
  const keys = path.split('.');
  let current: any = dictionaries[currentLocale];

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Fallback to key
    }
  }

  let result = typeof current === 'string' ? current : path;

  if (params && typeof result === 'string') {
    Object.keys(params).forEach(paramKey => {
      result = (result as string).replace(`{${paramKey}}`, String(params[paramKey]));
    });
  }

  return result as string;
};
