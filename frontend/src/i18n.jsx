// Minimal i18n stub: English + Urdu for login and navigation (the two surfaces
// a teacher sees first). Missing keys fall back to English so adding a language
// can never break the UI. Selecting Urdu also flips the page to RTL.
// To extend: add keys here, then a `ur` value per key — no library needed.
import { createContext, useContext, useEffect, useState } from 'react';

const translations = {
  en: {
    appName: 'ClassTrack',
    tagline: 'Attendance, without the paper register.',
    dashboard: 'Dashboard',
    classes: 'Classes',
    attendance: 'Attendance',
    register: 'Register',
    logout: 'Log out',
    login: 'Log in',
    createAccount: 'Create account',
    email: 'Email',
    password: 'Password',
    name: 'Full name',
    school: 'School (optional)',
    welcomeBack: 'Welcome back',
    noAccount: "Don't have an account? Register",
    haveAccount: 'Already have an account? Log in',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    delete: 'Delete',
    offlineQueue: 'offline, will sync',
    savedOffline: 'Saved offline — it will sync when you are back online.',
    saved: 'Saved.',
    language: 'اردو',
  },
  ur: {
    appName: 'کلاس ٹریک',
    tagline: 'حاضری، بغیر کاغذی رجسٹر کے۔',
    dashboard: 'ڈیش بورڈ',
    classes: 'کلاسز',
    attendance: 'حاضری',
    register: 'رجسٹر',
    logout: 'لاگ آؤٹ',
    login: 'لاگ ان',
    createAccount: 'اکاؤنٹ بنائیں',
    email: 'ای میل',
    password: 'پاس ورڈ',
    name: 'پورا نام',
    school: 'اسکول (اختیاری)',
    welcomeBack: 'خوش آمدید',
    noAccount: 'اکاؤنٹ نہیں ہے؟ رجسٹر کریں',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں',
    save: 'محفوظ کریں',
    cancel: 'منسوخ کریں',
    add: 'شامل کریں',
    delete: 'حذف کریں',
    offlineQueue: 'آف لائن، جلد مطابقت پذیر ہوگا',
    savedOffline: 'آف لائن محفوظ ہوگیا — آن لائن آتے ہی مطابقت پذیر ہوجائے گا۔',
    saved: 'محفوظ ہوگیا۔',
    language: 'English',
  },
};

const LanguageContext = createContext({ lang: 'en', t: (k) => k, setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('ct_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('ct_lang', lang);
    // Urdu reads right-to-left; flip the whole document, not just the text.
    document.documentElement.lang = lang === 'ur' ? 'ur' : 'en';
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key) => translations[lang][key] ?? translations.en[key] ?? key;
  return <LanguageContext.Provider value={{ lang, t, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}
