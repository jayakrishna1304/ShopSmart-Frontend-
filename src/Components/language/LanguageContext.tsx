import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translateCurrentPage: (targetLang: string) => Promise<void>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const cache: Record<string, string> = {};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read saved language from localStorage, fallback to 'en'
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('app_language') || 'en';
  });
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const fetchTranslation = async (text: string, targetLang: string): Promise<string> => {
    const trimmed = text.trim();
    if (!trimmed || /^\d+$/.test(trimmed)) return text;

    const cacheKey = `${targetLang}:${trimmed}`;
    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      const data = await res.json();
      const translated = data[0].map((item: any) => item[0]).join('');
      cache[cacheKey] = translated;
      return translated;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    }
  };

  const translateCurrentPage = async (targetLang: string) => {
    setIsTranslating(true);

    // Give React DOM a tiny delay (100ms) to finish rendering new page elements
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Translate DOM text nodes
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName.toLowerCase();
          if (['script', 'style', 'textarea', 'select', 'option'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        },
      }
    );

    const nodesToTranslate: Node[] = [];
    while (walker.nextNode()) {
      nodesToTranslate.push(walker.currentNode);
    }

    for (const node of nodesToTranslate) {
      const parent = node.parentElement;
      if (!parent) continue;

      if (!parent.getAttribute('data-original-text')) {
        parent.setAttribute('data-original-text', node.nodeValue || '');
      }

      if (targetLang === 'en') {
        const original = parent.getAttribute('data-original-text');
        if (original) node.nodeValue = original;
      } else {
        const original = parent.getAttribute('data-original-text') || node.nodeValue || '';
        const translated = await fetchTranslation(original, targetLang);
        node.nodeValue = translated;
      }
    }

    // Translate Input Placeholders
    const inputs = document.querySelectorAll('input[placeholder]');
    for (const input of Array.from(inputs) as HTMLInputElement[]) {
      if (!input.getAttribute('data-original-placeholder')) {
        input.setAttribute('data-original-placeholder', input.placeholder);
      }

      if (targetLang === 'en') {
        const original = input.getAttribute('data-original-placeholder');
        if (original) input.placeholder = original;
      } else {
        const original = input.getAttribute('data-original-placeholder') || input.placeholder;
        const translated = await fetchTranslation(original, targetLang);
        input.placeholder = translated;
      }
    }

    setIsTranslating(false);
  };

  const setLanguage = (lang: string) => {
    localStorage.setItem('app_language', lang);
    setLanguageState(lang);
    translateCurrentPage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translateCurrentPage, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};