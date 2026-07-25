/**
 * Verified Indian mental-health and de-addiction helplines.
 *
 * Static by design: this is the rail every AI failure state falls back to, so it
 * must never depend on a model call or a network round trip. Ordered by what a
 * person in crisis needs first — life safety, then addiction-specific support,
 * then general mental health.
 */
export type Helpline = {
  readonly name: string;
  readonly number: string;
  readonly detail: string;
  /** Life-threatening situations only — surfaced first and styled apart. */
  readonly emergency?: boolean;
};

export const HELPLINES: readonly Helpline[] = [
  {
    name: "Emergency",
    number: "112",
    detail: "Not breathing, unconscious, or took far more than usual — call this first",
    emergency: true,
  },
  {
    name: "NMBA De-Addiction Helpline",
    number: "14446",
    detail:
      "Nasha Mukt Bharat Abhiyaan, Ministry of Social Justice — 24x7 tele-counselling and referral to nearby treatment centres",
  },
  {
    name: "Tele-MANAS",
    number: "14416",
    detail: "Government of India mental health support, 24x7, many languages",
  },
  {
    name: "KIRAN Mental Health",
    number: "1800-599-0019",
    detail: "24x7 toll-free rehabilitation and distress helpline",
  },
  {
    name: "MANAS — report trafficking",
    number: "1933",
    detail: "National Narcotics Helpline, anonymous — for reporting supply, not for support",
  },
];
