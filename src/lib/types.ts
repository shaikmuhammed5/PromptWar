export type Substance =
  | "alcohol"
  | "tobacco"
  | "cannabis"
  | "opioids"
  | "gaming"
  | "other";

export type StreakBand = "today" | "week" | "month" | "sixMonths";

export type Profile = {
  readonly name: string;
  readonly substance: Substance;
  readonly streak: StreakBand;
  readonly triggers: readonly string[];
  readonly thunaiName: string;
  readonly thunaiPhone: string;
};

export type CheckIn = {
  readonly id: string;
  readonly at: number;
  readonly transcript: string;
  readonly mood: string;
  readonly riskScore: number;
  readonly summary: string;
  readonly triggersDetected: readonly string[];
  readonly toolsRecommended: readonly string[];
};

export type SosEvent = {
  readonly id: string;
  readonly at: number;
  readonly cravingLevel: number;
  readonly script: string;
};

export type JournalEntry = {
  readonly id: string;
  readonly at: number;
  readonly triggers: readonly string[];
  readonly advice: string;
};

export type AppState = {
  readonly profile: Profile | null;
  readonly checkIns: readonly CheckIn[];
  readonly sosEvents: readonly SosEvent[];
  readonly journal: readonly JournalEntry[];
};

export const EMPTY_STATE: AppState = {
  profile: null,
  checkIns: [],
  sosEvents: [],
  journal: [],
};

export const SUBSTANCE_LABELS: Readonly<Record<Substance, string>> = {
  alcohol: "Alcohol",
  tobacco: "Tobacco",
  cannabis: "Cannabis",
  opioids: "Opioids",
  gaming: "Gaming / screens",
  other: "Something else",
};

export const STREAK_LABELS: Readonly<Record<StreakBand, string>> = {
  today: "Today is day one",
  week: "About a week",
  month: "A month or more",
  sixMonths: "Six months or more",
};

export const TRIGGER_OPTIONS: readonly string[] = [
  "Stress",
  "Old friends",
  "Late nights",
  "Loneliness",
  "Money worries",
  "Celebrations",
  "Family conflict",
  "Boredom",
];
