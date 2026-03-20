"use client";

import type { ProviderOnboardingCopy } from "@/content/onboarding/provider-onboarding-copy";
import { ProviderWelcomeIllustration } from "./provider-welcome-illustration";

type Props = {
  copy: ProviderOnboardingCopy["welcome"];
  onNext: () => void;
};

export function ProviderWelcomeStep({ copy, onNext }: Props) {
  return (
    <div className="space-y-6">
      <ProviderWelcomeIllustration />
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mx-auto max-w-lg text-sm text-muted-foreground">{copy.body}</p>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          {copy.next}
        </button>
      </div>
    </div>
  );
}
