/**
 * Which Nigerian voices the picker offers, and where each one's preview clip lives.
 *
 * The previews are static files in /public/voice-previews/, made once from YarnGPT's own output by
 * the backend's scripts/generate_yarngpt_previews.py, which also writes manifest.json listing the
 * voices that really have a preview. The picker shows exactly those, so a voice YarnGPT stops
 * offering, or one that failed to generate, never appears as a play button that does nothing.
 *
 * Everything in the manifest is treated as untrusted input: a label must be a "(Nigerian)" voice and
 * a file a plain .wav name, so a bad manifest can't point the audio element somewhere else.
 */
export interface NigerianVoiceManifest {
  voices: string[];
  previews: Record<string, string>;
}

export const VOICE_PREVIEW_DIR = '/voice-previews';
export const VOICE_MANIFEST_URL = `${VOICE_PREVIEW_DIR}/manifest.json`;

const LABEL = /^[A-Za-z][A-Za-z ]{0,30} \(Nigerian\)$/;
const FILE = /^[a-z0-9_-]{1,40}\.wav$/i;

/** The voices and previews in a parsed manifest, or null if it holds nothing usable. */
export function parseVoiceManifest(raw: unknown): NigerianVoiceManifest | null {
  const entries = (raw as { voices?: unknown } | null)?.voices;
  if (!Array.isArray(entries)) return null;

  const voices: string[] = [];
  const previews: Record<string, string> = {};
  for (const entry of entries) {
    const label = (entry as { label?: unknown })?.label;
    const file = (entry as { file?: unknown })?.file;
    if (typeof label !== 'string' || typeof file !== 'string') continue;
    if (!LABEL.test(label) || !FILE.test(file) || label in previews) continue;
    voices.push(label);
    previews[label] = `${VOICE_PREVIEW_DIR}/${file}`;
  }
  return voices.length ? { voices, previews } : null;
}
