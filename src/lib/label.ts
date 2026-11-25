/** Text fitting and formatting for treemap tiles. */
export const CHAR_W = 0.6; // average glyph width as a fraction of font size
export const LINE_H = 1.2;
export const PAD = 6; // inner padding of a tile (both sides)
export const GAP = 2; // space between tiles

export interface LabelFit {
  font: number;
  vertical: boolean;
  clipped?: boolean;
}

/**
 * Largest font (maxFont..minFont px) at which the FULL name fits on ONE line.
 * Tall narrow tiles use vertical text. If nothing fits the name is clipped.
 * null = tile too small for any text.
 */
export function labelFit(w: number, h: number, name: string, maxFont = 14, minFont = 10): LabelFit | null {
  if (w < 18 || h < 12) {
    return null;
  }
  const vertical = h > w * 1.8 && w < 60;
  const along = (vertical ? h : w) - PAD;
  const across = (vertical ? w : h) - PAD;
  const len = name.length;
  for (let font = Math.max(minFont, maxFont); font >= minFont; font--) {
    if (len * font * CHAR_W <= along && font * LINE_H <= across) {
      return { font, vertical };
    }
  }
  return { font: Math.max(8, Math.min(10, Math.floor(across / LINE_H))), vertical, clipped: true };
}

export function fmtLoad(v: number): string {
  if (v < 0.1) {
    return '<0.1%';
  }
  return (v < 10 ? v.toFixed(1) : String(Math.round(v))) + '%';
}

export function fmtBytes(b?: number): string {
  if (b === undefined || !Number.isFinite(b)) {
    return '–';
  }
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (b >= 1024 && i < u.length - 1) {
    b /= 1024;
    i++;
  }
  return b.toFixed(i ? 1 : 0) + ' ' + u[i];
}

export function fmtBits(b?: number): string {
  if (b === undefined || !Number.isFinite(b)) {
    return '–';
  }
  const u = ['b/s', 'Kb/s', 'Mb/s', 'Gb/s'];
  let i = 0;
  while (b >= 1000 && i < u.length - 1) {
    b /= 1000;
    i++;
  }
  return b.toFixed(1) + ' ' + u[i];
}

/** "Load: 20%  ·  Mem: 1.5 GB" if it fits in width w, else "Load: 20%", else "20%". */
export function statLine(
  label: string,
  valueText: string,
  memText: string | undefined,
  w: number,
  font: number
): string {
  const room = w - PAD - GAP;
  const fits = (t: string) => t.length * font * CHAR_W <= room;
  const l = label ? label + ': ' + valueText : valueText;
  if (memText !== undefined) {
    const full = l + '  ·  Mem: ' + memText;
    if (fits(full)) {
      return full;
    }
  }
  return fits(l) ? l : valueText;
}
