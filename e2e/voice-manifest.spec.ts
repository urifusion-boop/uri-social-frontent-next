/**
 * The Nigerian voice picker shows exactly the voices in /voice-previews/manifest.json, and treats
 * that file as untrusted. No browser needed: this tests the parsing the picker relies on.
 */
import { test, expect } from '@playwright/test';

import { parseVoiceManifest } from '../src/components/app/workspace/voiceManifest';

const entry = (label: string, file: string) => ({ label, speaker: label.split(' ')[0].toLowerCase(), file });

test.describe('voice preview manifest', () => {
  test('every listed voice is offered, with its preview under /voice-previews', () => {
    const m = parseVoiceManifest({
      voices: [entry('Idera (Nigerian)', 'idera.wav'), entry('Chinenye (Nigerian)', 'chinenye.wav')],
    });
    expect(m?.voices).toEqual(['Idera (Nigerian)', 'Chinenye (Nigerian)']);
    expect(m?.previews['Chinenye (Nigerian)']).toBe('/voice-previews/chinenye.wav');
  });

  test('a voice with no preview file is simply not in the list', () => {
    const m = parseVoiceManifest({
      voices: [entry('Idera (Nigerian)', 'idera.wav'), { label: 'Tayo (Nigerian)' }, { file: 'x.wav' }],
    });
    expect(m?.voices).toEqual(['Idera (Nigerian)']);
  });

  test('a file name cannot point the audio element anywhere but the previews folder', () => {
    const m = parseVoiceManifest({
      voices: [
        entry('Idera (Nigerian)', '../../evil.wav'),
        entry('Jude (Nigerian)', 'https://evil.test/a.wav'),
        entry('Emma (Nigerian)', 'emma.exe'),
        entry('Tayo (Nigerian)', 'tayo.ogg'),
        entry('Umar (Nigerian)', 'umar.wav'),
      ],
    });
    expect(m?.voices).toEqual(['Umar (Nigerian)']);
  });

  test('MP3 previews, as the YarnGPT Studio downloads them, are accepted next to WAV ones', () => {
    const m = parseVoiceManifest({
      voices: [entry('Idera (Nigerian)', 'idera.mp3'), entry('Jude (Nigerian)', 'jude.WAV')],
    });
    expect(m?.voices).toEqual(['Idera (Nigerian)', 'Jude (Nigerian)']);
    expect(m?.previews['Idera (Nigerian)']).toBe('/voice-previews/idera.mp3');
  });

  test('only Nigerian voices are accepted, and a label is not repeated', () => {
    const m = parseVoiceManifest({
      voices: [
        entry('Sarah', 'sarah.wav'),
        entry('<img src=x> (Nigerian)', 'a.wav'),
        entry('Joke (Nigerian)', 'joke.wav'),
        entry('Joke (Nigerian)', 'other.wav'),
      ],
    });
    expect(m?.voices).toEqual(['Joke (Nigerian)']);
    expect(m?.previews['Joke (Nigerian)']).toBe('/voice-previews/joke.wav');
  });

  test('anything unusable gives null, so the picker keeps its two original voices', () => {
    for (const bad of [null, undefined, 'text', 42, {}, { voices: 'x' }, { voices: [] }, { voices: [{}] }]) {
      expect(parseVoiceManifest(bad)).toBeNull();
    }
  });
});
