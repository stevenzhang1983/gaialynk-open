"use client";

import { useId } from "react";
import type { CronPreset } from "@/lib/product/orchestration-ui-helpers";

export type { CronPreset } from "@/lib/product/orchestration-ui-helpers";

type CronPickerCopy = {
  daily9: string;
  weeklyMon9: string;
  custom: string;
  customPlaceholder: string;
  utcNote: string;
};

type Props = {
  copy: CronPickerCopy;
  value: { preset: CronPreset; customCron: string };
  onChange: (v: { preset: CronPreset; customCron: string }) => void;
};

export function CronPicker({ copy, value, onChange }: Props) {
  const gid = useId();

  return (
    <div className="space-y-3 text-xs">
      <fieldset>
        <legend className="sr-only">{copy.custom}</legend>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-2 hover:bg-muted/40">
            <input
              type="radio"
              name={`${gid}-preset`}
              checked={value.preset === "daily9"}
              onChange={() => onChange({ ...value, preset: "daily9" })}
              className="accent-primary"
            />
            <span>{copy.daily9}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-2 hover:bg-muted/40">
            <input
              type="radio"
              name={`${gid}-preset`}
              checked={value.preset === "weeklyMon9"}
              onChange={() => onChange({ ...value, preset: "weeklyMon9" })}
              className="accent-primary"
            />
            <span>{copy.weeklyMon9}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background px-2.5 py-2 hover:bg-muted/40">
            <input
              type="radio"
              name={`${gid}-preset`}
              checked={value.preset === "custom"}
              onChange={() => onChange({ ...value, preset: "custom" })}
              className="accent-primary"
            />
            <span>{copy.custom}</span>
          </label>
        </div>
      </fieldset>
      {value.preset === "custom" && (
        <div>
          <input
            type="text"
            value={value.customCron}
            onChange={(e) => onChange({ ...value, customCron: e.target.value })}
            placeholder={copy.customPlaceholder}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-[0.6875rem]"
            spellCheck={false}
            autoComplete="off"
            aria-label={copy.customPlaceholder}
          />
        </div>
      )}
      <p className="text-[0.625rem] leading-relaxed text-muted-foreground">{copy.utcNote}</p>
    </div>
  );
}
