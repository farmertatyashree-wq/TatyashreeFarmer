export type Language = 'english' | 'hindi' | 'marathi';

export const DEFAULT_LANGUAGE: Language = 'marathi';
export const languageLocales: Record<Language, string> = {
  english: 'en-IN', hindi: 'hi-IN', marathi: 'mr-IN',
};

export function isLanguage(value: unknown): value is Language {
  return value === 'english' || value === 'hindi' || value === 'marathi';
}

export function resolveLanguage(value: unknown): Language {
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

export function localizedNumber(value: number, language: Language, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(languageLocales[language], options).format(value);
}

export function localizedCurrency(value: number, language: Language) {
  return localizedNumber(value, language, { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}

export function localizedDate(value: Date | string, language: Language, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(languageLocales[language], options ?? { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}