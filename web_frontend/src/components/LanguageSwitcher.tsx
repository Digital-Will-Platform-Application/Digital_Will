import { useState } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLanguageCode } from "@/i18n/config";
import { Languages, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
];

interface LanguageSwitcherProps {
  showText?: boolean;
}

const LanguageSwitcher = ({ showText = false }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (langCode: string) => {
    void i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const resolved = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);
  const currentLanguage = languages.find((lang) => lang.code === resolved) || languages[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="w-4 h-4" />
          {showText ? (
            <span>{currentLanguage.nativeName}</span>
          ) : (
            <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{language.nativeName}</span>
            {resolved === language.code && (
              <Check className="w-4 h-4 text-gold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
