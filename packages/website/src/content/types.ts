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
    /** 官网区导航（T-2.2） */
    roadmap?: string;
    pricing?: string;
    openApp?: string;
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
    /** T-3.1 首页 Hero 专用文案（三语对等） */
    hero?: {
      eyebrow: string;
      title: string;
      subtitle: string;
      ctaPrimary: string;
      ctaSecondary: string;
    };
    /** T-3.3 首页核心价值主张：标题 + 三张卡片（短标题 + hover 展开说明） */
    valueProposition?: {
      title: string;
      cards: [
        { title: string; description: string },
        { title: string; description: string },
        { title: string; description: string },
      ];
    };
    /** T-3.4 首页 How It Works：五步可信调用流程，可点击展开详情 */
    howItWorks?: {
      title: string;
      steps: [
        { summary: string; detail: string },
        { summary: string; detail: string },
        { summary: string; detail: string },
        { summary: string; detail: string },
        { summary: string; detail: string },
      ];
    };
    /** T-3.7 首页收尾 CTA：准备好了吗？+ Open App / Start Building / Book a Demo（不含 Join Waitlist） */
    finalCta?: {
      heading: string;
      openApp: string;
      startBuilding: string;
      bookDemo: string;
    };
    /** T-6.5 首页产品预览区小标题（三语） */
    previewSectionTitle?: string;
  };
  /** T-3.7 Footer 链接文案（全站复用） */
  footer?: {
    privacy: string;
    cookies: string;
    github: string;
    contact: string;
  };
  developers: PageCopy;
  trust: PageCopy;
  useCases: PageCopy;
  waitlist: PageCopy;
  demo: PageCopy;
  docs: PageCopy;
  ask: PageCopy & { demoHeading?: string };
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
