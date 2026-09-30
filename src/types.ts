/** Language codes Sarvam AI supports, as BCP-47-ish tags used by their API. */
export type LangCode =
  | 'en-IN'
  | 'hi-IN'
  | 'bn-IN'
  | 'ta-IN'
  | 'te-IN'
  | 'mr-IN'
  | 'gu-IN'
  | 'kn-IN'
  | 'ml-IN'
  | 'pa-IN'
  | 'or-IN';

export interface Language {
  code: LangCode;
  /** Name written in the language itself — never only the English name. */
  native: string;
  english: string;
  /** Region hint shown to users picking their "local" language. */
  region: string;
  /** Voice id for Sarvam bulbul TTS. */
  voice: string;
}

/** Teammate ids. Stable — used in routing rules, sub-agent ids and telemetry. */
export type AgentId =
  | 'router'
  | 'ration'
  | 'shelter'
  | 'emergency'
  | 'health'
  | 'livelihood'
  | 'documents'
  | 'money'
  | 'grievance'
  // Sector teammates, added with the government-services dashboard.
  | 'farmer'
  | 'education'
  | 'enterprise'
  // Advanced bots: they run deterministic tools, not only a prompt.
  | 'scam'
  | 'calculator'
  | 'planner';

/** Every agent that actually answers (the router only routes). */
export type WorkerId = Exclude<AgentId, 'router'>;

/**
 * A narrow specialist inside a teammate. Chosen automatically by the
 * sub-router; pickable by hand only in developer mode.
 */
export interface SubAgentSpec {
  /** `<parent>.<slug>`, e.g. `ration.portability`. */
  id: string;
  parent: WorkerId;
  name: string;
  /** One line shown in the developer picker. */
  focus: string;
  triggers: string[];
  /** Appended to the parent's system prompt when this sub-agent is active. */
  system: string;
  /** One-sentence tip added to offline answers so the focus is visible without a key. */
  tip: { en: string; hi: string };
}

/** A tool an advanced bot ran, shown in the answer and the dev trace. */
export interface ToolRun {
  name: string;
  input: string;
  output: string;
}

/** Explicit routing choice: a teammate, and optionally one of its sub-agents. */
export interface ForcedRoute {
  agent: WorkerId;
  sub?: string;
  /**
   * `dashboard`: the question came from a scheme/service card, so the card's
   * owner answers — but collaborators still join, and a life-risk message
   * still goes to the emergency responder.
   */
  origin?: 'pin' | 'dashboard';
  /** What the user clicked, e.g. "PM-KISAN". Shown in the routing trace. */
  label?: string;
}

/** Who the dashboard is tailored for. */
export type PersonaId =
  | 'farmer'
  | 'worker'
  | 'women'
  | 'senior'
  | 'student'
  | 'disability'
  | 'vendor'
  | 'family';

/**
 * Optional self-reported facts for the eligibility checker. Kept on this
 * device only; never sent anywhere except as a one-line summary in the AI
 * prompt, and never includes an ID number.
 */
export interface Profile {
  age?: number;
  gender?: 'female' | 'male' | 'other';
  area?: 'rural' | 'urban';
  /** Monthly household income in rupees. */
  income?: number;
  landHectares?: number;
  rationCard?: 'aay' | 'phh' | 'none';
  disabilityPct?: number;
  pregnant?: boolean;
  widow?: boolean;
  student?: boolean;
  incomeTaxPayer?: boolean;
  govtEmployee?: boolean;
  hasLpg?: boolean;
  puccaHouse?: boolean;
  formalJob?: boolean;
}

export interface AgentSpec {
  id: AgentId;
  /** Short human name, e.g. "Ration Didi". */
  name: string;
  role: string;
  /** One-line description shown on the teammate card. */
  blurb: string;
  emoji: string;
  /** Tailwind-safe accent used for the agent's border / badge. */
  accent: string;
  /** Weighted trigger terms, per language family. Lowercased. */
  triggers: string[];
  /** Agents this one habitually pulls in as collaborators. */
  collaborators: AgentId[];
  /** System instruction sent to the model when this agent answers. */
  system: string;
  /** Concrete starter prompts, in English; translated at render time. */
  samples: string[];
  /** True when the agent must always answer first and fast. */
  urgent?: boolean;
  /** `advanced` bots run tools and/or orchestrate other agents. */
  tier?: 'core' | 'advanced';
}

export type Urgency = 'routine' | 'time-sensitive' | 'emergency';

export interface RoutingDecision {
  primary: AgentId;
  collaborators: AgentId[];
  urgency: Urgency;
  /** 0..1 — how sure the router is about `primary`. */
  confidence: number;
  /** Human-readable reason, shown in the routing trace. */
  rationale: string;
  /** Which engine produced the decision. */
  engine: 'rules' | 'sarvam-llm' | 'fallback' | 'dashboard';
  /** Per-agent scores, for the transparency panel. */
  scores: Array<{ agent: AgentId; score: number }>;
  detectedLanguage?: LangCode;
  /** Sub-agent inside `primary` that handles the question. */
  subAgent?: string;
  subScores?: Array<{ sub: string; score: number }>;
  /** How the sub-agent was chosen. */
  subEngine?: 'rules' | 'default' | 'forced';
  /** Planner only: the sub-problems it split the question into. */
  plan?: Array<{ part: string; agent: WorkerId; sub?: string }>;
}

export type MessageAuthor = 'user' | 'system' | AgentId;

export interface ResourceCard {
  id: string;
  kind: 'ration-shop' | 'shelter' | 'hospital' | 'helpline' | 'office' | 'work-site';
  name: string;
  detail: string;
  address?: string;
  phone?: string;
  hours?: string;
  distanceKm?: number;
  /** e.g. "Stock available", "Full", "24x7" */
  status?: { label: string; tone: 'ok' | 'warn' | 'danger' | 'muted' };
  lat?: number;
  lng?: number;
}

export interface ActionStep {
  text: string;
  /** Documents or things to carry for this step. */
  carry?: string[];
}

export interface Message {
  id: string;
  author: MessageAuthor;
  /** Body text in the user's chosen language. */
  body: string;
  /** Original English body, kept so we can re-translate on language switch. */
  sourceBody?: string;
  createdAt: number;
  routing?: RoutingDecision;
  resources?: ResourceCard[];
  steps?: ActionStep[];
  helplines?: ResourceCard[];
  /** Agent-to-agent handoff note, rendered differently from a user answer. */
  handoff?: { from: AgentId; to: AgentId; why: string };
  pending?: boolean;
  error?: string;
  subAgent?: string;
  tools?: ToolRun[];
  /** Wall-clock time for this agent's answer, shown in developer mode. */
  elapsedMs?: number;
}

export interface UserPlace {
  label: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}

export interface Settings {
  lang: LangCode;
  theme: 'light' | 'dark';
  contrast: 'normal' | 'high';
  font: 'default' | 'readable';
  motion: 'full' | 'reduced';
  /** 0.9 .. 1.6 */
  scale: number;
  /** Read every agent reply aloud automatically. */
  autoSpeak: boolean;
  /** Show the router's scoring panel. */
  showTrace: boolean;
  simpleLanguage: boolean;
  place: UserPlace;
  /** Exposes the sub-agent picker, router engine switch and debug traces. */
  devMode: boolean;
  /** Developer override: `rules` never calls the LLM router. */
  routerEngine: 'auto' | 'rules';
  /** Dashboard audience. Also biases the router when a question matches nothing. */
  persona: PersonaId;
  profile: Profile;
}
