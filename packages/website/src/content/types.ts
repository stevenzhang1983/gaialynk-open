import type { Locale } from "@/lib/i18n/locales";

export type PageCopy = {
  title: string;
  description: string;
  primaryCta: string;
  seoTitle: string;
  seoDescription: string;
};

export type Dictionary = {
  localeLabel: string;
  nav: {
    ask: string;
    developers: string;
    trust: string;
    useCases: string;
    docs: string;
    analytics: string;
    tasks?: string;
    agents?: string;
    approvals?: string;
    history?: string;
    connector?: string;
    settings?: string;
  };
  home: PageCopy & {
    eyebrow: string;
    valuePoints: [string, string, string];
    evidenceTitle: string;
    evidenceDescription: string;
    evidencePoints: [string, string, string];
    secondaryCtas: {
      demo: string;
      waitlist: string;
    };
  };
  developers: PageCopy;
  trust: PageCopy;
  useCases: PageCopy;
  waitlist: PageCopy;
  demo: PageCopy;
  docs: PageCopy;
  ask: PageCopy;
  recovery: PageCopy;
  subscriptions: PageCopy;
  connectors: PageCopy;
  auth?: {
    loginRequired: string;
    loginCta: string;
    sessionExpired: string;
    permissionDenied: string;
  };
};

export type DictionaryMap = Record<Locale, Dictionary>;
