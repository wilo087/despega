import type { AffinityDelta, AffinityProfile } from "../types.ts";

export type TaskKind =
  | "avatar"
  | "walk"
  | "dialogue"
  | "hazards"
  | "explore"
  | "measure"
  | "spreadsheet"
  | "message"
  | "cutscene"
  | "summary"
  | "causes"
  | "layout"
  | "budget"
  | "inspection"
  | "staff"
  | "dashboard"
  | "timeline";
export type Skill = "soft" | "technical" | "tools";
export type FactoryTutorialStep =
  "welcome" | "move" | "interact" | "tablet" | "ready";
export type FactoryTutorial = {
  step: FactoryTutorialStep;
  active: boolean;
  completed: boolean;
  suspended: boolean;
  returnPaused: boolean;
  origin: { x: number; z: number };
};
export type Placement = { id: string; x: number; z: number; rotation: number };
export type FactoryChoice = { id: string; label: string; cost?: number };
export type FactoryTask = {
  kind: TaskKind;
  zone: string;
  speaker: string;
  prompt: string;
  timeLimit?: number;
  choices?: readonly FactoryChoice[];
  cards?: readonly FactoryChoice[];
  categories?: readonly FactoryChoice[];
  skills?: readonly Skill[];
  method?: boolean;
  /** Evaluation data is never copied into PublicFactoryWorld. */
  answers?: Readonly<Record<string, string>>;
  /** Observable physical evidence, rendered without correctness labels. */
  samples?: readonly { id: string; sealGap: number }[];
};
export type FactoryCommand =
  | {
      op: "tutorial";
      action: "start" | "advance" | "finish" | "skip";
      expectedStep?: FactoryTutorialStep;
      position?: { x: number; z: number };
    }
  | { op: "checkpoint"; position?: { x: number; z: number }; elapsedMs: number }
  | { op: "settings"; extendedTime: boolean }
  | {
      op: "draft";
      method?: "structured" | "creative";
      measurements?: Record<string, number[]>;
      choices?: string[];
      assignments?: Record<string, string>;
      layout?: Placement[];
    }
  | { op: "pause" | "resume" }
  | { op: "interact"; targetId: string }
  | {
      op: "submit";
      choices?: string[];
      assignments?: Record<string, string>;
      measurements?: Record<string, number[]>;
      layout?: Placement[];
      value?: number;
      method?: "structured" | "creative";
      timedOut?: boolean;
      avatar?: "alma" | "leo";
      name?: string;
      guided?: boolean;
    };
export type FactoryState = {
  tutorial?: FactoryTutorial;
  avatar: "alma" | "leo";
  position: { x: number; z: number };
  visited: string[];
  hazards: string[];
  objectives: string[];
  measurements: Record<string, number[]>;
  layout: Placement[];
  budget: string[];
  skills: Record<Skill, { earned: number; possible: number }>;
  taskElapsedMs: number;
  paused: boolean;
  sheetReady?: boolean;
  draft?: {
    method?: "structured" | "creative";
    measurements?: Record<string, number[]>;
    choices?: string[];
    assignments?: Record<string, string>;
    layout?: Placement[];
  };
  lastCommandId?: string;
  lastReaction?: string;
  layoutPenalized: boolean;
  production: {
    good: number;
    rejected: number;
    workedSeconds: number[];
    downtimeSeconds: number;
    dispatched?: number;
  };
};
export type PublicFactoryWorld = {
  tutorial?: Pick<
    FactoryTutorial,
    "step" | "active" | "completed" | "suspended" | "origin"
  >;
  task: Omit<FactoryTask, "answers" | "skills">;
  avatar: "alma" | "leo";
  position: { x: number; z: number };
  visited: readonly string[];
  hazards: readonly string[];
  objectives: readonly string[];
  measurements: Record<string, number[]>;
  layout: readonly Placement[];
  budget: readonly string[];
  shiftSecondsRemaining: number;
  incidents: number;
  reportEstimated: boolean;
  measurementEstimated: boolean;
  staff: Record<string, string>;
  openZones: readonly string[];
  lineRunning: boolean;
  stationCycles: Record<string, number>;
  yuleisyAbsent: boolean;
  remaining: number;
  produced: number;
  rejected: number;
  spent: number;
  climate: number;
  wilfredoTrust: number;
  yuleisyTrust: number;
  ally: boolean;
  machineFound: boolean;
  purchaseRequired: boolean;
  draft?: FactoryState["draft"];
  extendedTime: boolean;
  taskElapsedMs: number;
  paused: boolean;
  reaction?: string;
  affinity: AffinityProfile;
  skills: Record<Skill, number | null>;
  shipment?: number;
  cycleSeconds: number;
  overtime: boolean;
};
export type FactoryGrade = {
  affinity?: AffinityDelta;
  performance?: number;
  credit?: number;
  reaction: string;
};
