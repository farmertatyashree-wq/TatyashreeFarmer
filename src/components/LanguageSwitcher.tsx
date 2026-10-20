import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'english', label: 'English', nativeLabel: 'English' },
  { code: 'hindi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'marathi', label: 'Marathi', nativeLabel: 'मराठी' },
];

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const currentLang = languages.find(l => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 px-3">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">{currentLang?.nativeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${language === lang.code ? 'bg-primary/10 text-primary' : ''}`}
          >
            <span className="flex-1">{lang.nativeLabel}</span>
            {language === lang.code && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
