import React from 'react';
import { useLanguage } from './LanguageContext';

export const TranslateDropdown: React.FC = () => {
  const { language, setLanguage, isTranslating } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">🌐</span>
      <select
        value={language}
        disabled={isTranslating}
        onChange={(e) => setLanguage(e.target.value)}
        className="px-3 py-1.5 rounded-lg border text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 focus:outline-none cursor-pointer disabled:opacity-50"
      >
        <option value="en">English</option>
        <option value="kn">ಕನ್ನಡ (Kannada)</option>
        <option value="te">తెలుగు (Telugu)</option>
        <option value="hi">हिंदी (Hindi)</option>
      </select>
      
    </div>
  );
};