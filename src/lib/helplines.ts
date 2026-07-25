/**
 * Verified Indian mental-health and de-addiction helplines.
 * Static by design: this is the rail every AI failure state falls back to,
 * so it must never depend on a model call or a network round trip.
 */
export type Helpline = {
  readonly name: string;
  readonly number: string;
  readonly detail: string;
};

export const HELPLINES: readonly Helpline[] = [
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
    name: "National De-Addiction Helpline",
    number: "1800-11-0031",
    detail: "Ministry of Social Justice, substance use support",
  },
  {
    name: "NIMHANS Centre for Well Being",
    number: "080-2668-5948",
    detail: "Counselling and de-addiction guidance, Bengaluru",
  },
  {
    name: "Emergency",
    number: "112",
    detail: "Immediate danger to life — call this first",
  },
];
