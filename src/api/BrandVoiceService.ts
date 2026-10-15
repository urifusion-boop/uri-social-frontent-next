import { UriHttpClient } from '@/src/configs/http.config';

// Brand Voice (inbox personality) endpoints. Plain JSON, like the rest of /inbox.

export type TraitKey =
  | 'formality'
  | 'warmth'
  | 'enthusiasm'
  | 'humour'
  | 'empathy'
  | 'directness'
  | 'verbosity'
  | 'proactivity'
  | 'sales_assertiveness'
  | 'emoji'
  | 'question_frequency'
  | 'localization';

export type Traits = Record<TraitKey, number>;

export interface VoiceTemplate {
  id: string;
  name: string;
  voice: string;
  suitable_for: string;
  example: string;
  traits: Traits;
}

export interface VoiceScenario {
  id: string;
  title: string;
  message: string;
  situation: string;
}

export interface VoiceCatalog {
  templates: VoiceTemplate[];
  traits: TraitKey[];
  trait_labels: Record<TraitKey, [string, string]>;
  scenarios: VoiceScenario[];
  feedback_labels: Record<string, string>;
}

export interface VoiceLanguage {
  default: 'en' | 'en-NG';
  allowed: string[];
  pidgin: 'switch' | 'light' | 'english' | 'ask';
  pidgin_degree: 'light' | 'moderate' | 'full';
  pidgin_review: boolean;
  local_expression: string;
  slang: string;
  mirror_formality: string;
  address: string;
  pidgin_examples: string[];
}

export interface VoiceProfile {
  id: string;
  name: string;
  summary: string;
  template_id: string;
  traits: Traits;
  language: VoiceLanguage;
  style: Record<string, unknown> & { preferred_phrases: string[]; banned_phrases: string[] };
  sales: Record<string, unknown>;
  situational: Record<string, unknown>;
  channel_overrides: { dm: Partial<Traits>; comment: Partial<Traits> };
  departments: string[];
  is_default: boolean;
  status: 'draft' | 'published';
  active_version: number | null;
  has_unpublished_changes: boolean;
  source_methods: string[];
  published_at: string | null;
  updated_at: string | null;
}

export interface AssessmentOption {
  value: string;
  label: string;
}

export interface AssessmentQuestion {
  id: string;
  section: string;
  text: string;
  type: 'single' | 'multi' | 'slider' | 'text' | 'examples';
  required: boolean;
  options?: AssessmentOption[];
  max_select?: number;
  low?: string;
  high?: string;
  placeholder?: string;
  prompts?: string[];
}

export type AnswerValue = string | number | string[];

export interface AssessmentState {
  sections: { id: string; title: string }[];
  questions: AssessmentQuestion[];
  follow_ups: AssessmentQuestion[];
  conflicts: AssessmentQuestion[];
  answers: Record<string, AnswerValue>;
  answered: number;
  total: number;
  missing_required: string[];
}

export interface VoiceExample {
  id: string;
  text: string;
  brand_lines: string[];
  customer_lines: string[];
  source: string;
  approved: boolean;
  language: string;
  scenario: string;
  created_at: string | null;
}

export interface TraitProposal {
  current: number;
  proposed: number;
  evidence: string;
  measured: boolean;
}

export interface ExampleAnalysis {
  proposed: Partial<Record<TraitKey, TraitProposal>>;
  measured: { avg_words?: number; emoji_per_reply?: number; question_rate?: number; greetings?: string[] };
  tone_shifts: string;
  examples_used: number;
}

export interface PreviewReply {
  scenario_id: string;
  title: string;
  message: string;
  situation: string;
  situation_label: string;
  reply: string;
  confidence: number;
  sources: { id: string; label: string; approved: boolean }[];
  banned_words: string[];
}

export interface VoiceVersion {
  version: number;
  published_by: string;
  published_at: string | null;
  note: string;
  name: string;
  summary: string;
}

export interface VoiceAuditEntry {
  action: string;
  actor_id: string;
  at: string | null;
  detail: Record<string, unknown>;
}

export interface VoiceSuggestion {
  id: string;
  profile_id: string;
  title: string;
  change: Partial<Traits>;
  evidence: string;
}

export interface VoiceInsights {
  metrics: {
    drafts: number;
    auto_sent: number;
    sent_as_is: number;
    edited: number;
    ignored: number;
    accepted_rate: number | null;
    edited_rate: number | null;
    median_edit_length_ratio: number | null;
    held_for_review: number;
    situations: Record<string, number>;
  };
  suggestions: VoiceSuggestion[];
}

const http = () => UriHttpClient.getClient();
const base = '/inbox/personality';

const catalog = async (): Promise<VoiceCatalog> => (await http().get(`${base}/templates`)).data;

const overview = async (): Promise<{ profiles: VoiceProfile[]; can_publish: boolean }> =>
  (await http().get(`${base}/overview`)).data;

const getAssessment = async (): Promise<AssessmentState> => (await http().get(`${base}/assessment`)).data;

const saveAnswers = async (answers: Record<string, AnswerValue>): Promise<AssessmentState> =>
  (await http().post(`${base}/assessment/responses`, { answers })).data;

const generate = async (profileId?: string): Promise<VoiceProfile> =>
  (await http().post(`${base}/generate`, { profile_id: profileId ?? null })).data.profile;

const createProfile = async (templateId?: string, name?: string): Promise<VoiceProfile> =>
  (await http().post(`${base}/profiles`, { template_id: templateId ?? null, name: name ?? null })).data.profile;

const updateProfile = async (
  id: string,
  fields: Partial<VoiceProfile> & { apply_template?: boolean }
): Promise<VoiceProfile> => (await http().put(`${base}/profiles/${id}`, fields)).data.profile;

const archiveProfile = async (id: string): Promise<void> => {
  await http().delete(`${base}/profiles/${id}`);
};

const publish = async (id: string, note = ''): Promise<VoiceProfile> =>
  (await http().post(`${base}/profiles/${id}/publish`, { note })).data.profile;

const rollback = async (id: string, version: number): Promise<VoiceProfile> =>
  (await http().post(`${base}/profiles/${id}/rollback`, { version })).data.profile;

const versions = async (id: string): Promise<{ versions: VoiceVersion[]; audit: VoiceAuditEntry[] }> =>
  (await http().get(`${base}/profiles/${id}/versions`)).data;

const listExamples = async (): Promise<VoiceExample[]> => (await http().get(`${base}/examples`)).data.examples;

const addExample = async (text: string, source: string, scenario = '', language = 'en'): Promise<VoiceExample> =>
  (await http().post(`${base}/examples`, { text, source, scenario, language })).data.example;

const importFromInbox = async (): Promise<VoiceExample[]> =>
  (await http().post(`${base}/examples/import-inbox`, {})).data.examples;

const updateExample = async (id: string, fields: Partial<VoiceExample>): Promise<VoiceExample> =>
  (await http().patch(`${base}/examples/${id}`, fields)).data.example;

const deleteExample = async (id: string): Promise<void> => {
  await http().delete(`${base}/examples/${id}`);
};

const analyze = async (profileId: string, exampleIds?: string[]): Promise<ExampleAnalysis> =>
  (await http().post(`${base}/analyze-examples`, { profile_id: profileId, example_ids: exampleIds ?? null })).data;

const applyAnalysis = async (profileId: string, traits: Partial<Traits>): Promise<VoiceProfile> =>
  (await http().post(`${base}/profiles/${profileId}/apply-analysis`, { traits })).data.profile;

const preview = async (params: {
  profileId?: string;
  profile?: Partial<VoiceProfile>;
  scenarioIds?: string[];
  message?: string;
  kind?: 'dm' | 'comment';
  language?: 'en' | 'pcm';
}): Promise<PreviewReply[]> =>
  (
    await http().post(`${base}/preview`, {
      profile_id: params.profileId ?? null,
      profile: params.profile ?? null,
      scenario_ids: params.scenarioIds ?? null,
      message: params.message ?? '',
      kind: params.kind ?? 'dm',
      language: params.language ?? 'en',
    })
  ).data.replies;

const calibrate = async (params: {
  profileId: string;
  scenarioId: string;
  reply: string;
  label: string;
  rewrite?: string;
}): Promise<{ profile: VoiceProfile; before: string; after: PreviewReply | null }> =>
  (
    await http().post(`${base}/calibration`, {
      profile_id: params.profileId,
      scenario_id: params.scenarioId,
      reply: params.reply,
      label: params.label,
      rewrite: params.rewrite ?? '',
    })
  ).data;

const calibrationHistory = async (
  profileId: string
): Promise<{ scenario_id: string; label: string; label_text: string; reply: string; rewrite: string; at: string }[]> =>
  (await http().get(`${base}/calibration`, { params: { profile_id: profileId } })).data.history;

const insights = async (): Promise<VoiceInsights> => (await http().get(`${base}/insights`)).data;

const decideSuggestion = async (id: string, accept: boolean): Promise<VoiceProfile | null> =>
  (await http().post(`${base}/suggestions/${id}`, { accept })).data.profile;

export const BrandVoiceService = {
  catalog,
  overview,
  getAssessment,
  saveAnswers,
  generate,
  createProfile,
  updateProfile,
  archiveProfile,
  publish,
  rollback,
  versions,
  listExamples,
  addExample,
  importFromInbox,
  updateExample,
  deleteExample,
  analyze,
  applyAnalysis,
  preview,
  calibrate,
  calibrationHistory,
  insights,
  decideSuggestion,
};
