/*
 * Docs-only helpers for the media examples (audio player, transcription):
 * a synthesized WAV clip, so the examples play without shipping an audio
 * file or hitting the network. Not part of the registry.
 */

/**
 * A short mono 8-bit WAV of soft chimes, as base64. `seconds` sets the
 * length; one chime per second so seeking is audible.
 */
export function chimeWavBase64(seconds = 6, sampleRate = 8000): string {
  const samples = Math.round(seconds * sampleRate);
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // byte rate
  view.setUint16(32, 1, true); // block align
  view.setUint16(34, 8, true); // bits per sample
  ascii(36, "data");
  view.setUint32(40, samples, true);
  const notes = [523.25, 659.25, 783.99, 659.25];
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const beat = Math.floor(t);
    const local = t - beat;
    const freq = notes[beat % notes.length] ?? 523.25;
    const envelope = Math.exp(-local * 5);
    bytes[44 + i] = 128 + Math.round(Math.sin(2 * Math.PI * freq * t) * envelope * 60);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
