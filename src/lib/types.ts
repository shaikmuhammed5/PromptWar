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
  readonly anchorName: string;
  readonly anchorPhone: string;
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

/**
 * Companion chat.
 *
 * Three modes, and every one of them has a recovery job — there is deliberately
 * no open-ended "AI friend" mode. Unbounded companionship is the failure mode
 * the literature warns about hardest for this population.
 */
export type ChatMode = "talk" | "practice" | "distract";

export type ChatTurn = {
  readonly role: "user" | "assistant";
  readonly text: string;
  readonly at: number;
};

export type ChatSession = {
  readonly id: string;
  readonly mode: ChatMode;
  readonly startedAt: number;
  readonly turns: readonly ChatTurn[];
  /** practice mode: the situation being rehearsed and who the model plays. */
  readonly scenario?: string;
  readonly persona?: string;
  /** distract mode: which game is running. */
  readonly game?: string;
  /** Set when the user closes the session; distract mode logs minutes ridden out. */
  readonly endedAt?: number;
};

export type RehearsalScore = {
  readonly id: string;
  readonly at: number;
  readonly scenario: string;
  readonly worked: readonly string[];
  readonly strengthen: string;
  readonly pocketLine: string;
};

export type AppState = {
  readonly profile: Profile | null;
  readonly checkIns: readonly CheckIn[];
  readonly sosEvents: readonly SosEvent[];
  readonly journal: readonly JournalEntry[];
  readonly chats: readonly ChatSession[];
  readonly rehearsals: readonly RehearsalScore[];
};

export const EMPTY_STATE: AppState = {
  profile: null,
  checkIns: [],
  sosEvents: [],
  journal: [],
  chats: [],
  rehearsals: [],
};

export const CHAT_MODE_LABELS: Readonly<Record<ChatMode, string>> = {
  talk: "Talk it out",
  practice: "Practice the moment",
  distract: "Ride it out",
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
