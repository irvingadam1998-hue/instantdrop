import type { TranslationKey } from './i18n'

const EMOJI_MAP: Record<string, string> = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📊', pptx: '📊',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🎭', webp: '🖼️', svg: '🎨',
  mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬', mp3: '🎵', wav: '🎵', flac: '🎵',
  zip: '📦', rar: '📦', gz: '📦', '7z': '📦',
  exe: '⚠️', dmg: '⚠️', sh: '⚠️',
  txt: '📃', md: '📃', csv: '📃', json: '🔧', js: '🔧', py: '🔧',
}

const VIBE_KEY_MAP: Record<string, TranslationKey> = {
  pdf: 'vibe.pdf',
  doc: 'vibe.doc', docx: 'vibe.doc',
  xls: 'vibe.xls', xlsx: 'vibe.xls',
  jpg: 'vibe.jpg', jpeg: 'vibe.jpg',
  png: 'vibe.png',
  gif: 'vibe.gif',
  mp4: 'vibe.mp4', mov: 'vibe.mp4',
  mp3: 'vibe.mp3', flac: 'vibe.mp3',
  zip: 'vibe.zip', rar: 'vibe.rar',
  exe: 'vibe.exe', dmg: 'vibe.dmg',
  txt: 'vibe.txt',
  json: 'vibe.json',
  py: 'vibe.py',
  js: 'vibe.js',
}

function extOf(name: string) {
  return name.split('.').pop()?.toLowerCase() || ''
}

export function getFileEmoji(name: string): string {
  return EMOJI_MAP[extOf(name)] || '📁'
}

export function getFileVibeKey(name: string): TranslationKey {
  return VIBE_KEY_MAP[extOf(name)] || 'vibe.default'
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'b'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'kb'
  return (bytes / 1048576).toFixed(1) + 'mb'
}
