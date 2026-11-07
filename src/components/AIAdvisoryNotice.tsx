import { useLanguage } from '@/contexts/LanguageContext';
import { advisoryNotice } from '@/lib/ai/schemas';
export function AIAdvisoryNotice() {
  const { language } = useLanguage();
  return <p className="text-sm text-muted-foreground border-l-2 border-warning pl-3 py-2">{advisoryNotice[language]}</p>;
}