/** Squarified treemap layout (Bruls, Huizing & van Wijk) plus tile-size helpers. */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Sized {
  key: string;
  value: number;
}

export interface Tile<T extends Sized> extends Rect {
  key: string;
  value: number;
  item: T;
}

interface Pending<T> {
  key: string;
  value: number;
  item: T;
  area: number;
}

function worst<T>(row: Array<Pending<T>>, side: number): number {
  let s = 0;
  let mx = -Infinity;
  let mn = Infinity;
  for (const r of row) {
    s += r.area;
    mx = Math.max(mx, r.area);
    mn = Math.min(mn, r.area);
  }
  return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
}

function placeRow<T extends Sized>(row: Array<Pending<T>>, rect: Rect, out: Array<Tile<T>>): Rect {
  const s = row.reduce((a, r) => a + r.area, 0);
  if (rect.w >= rect.h) {
    // column on the left
    const cw = s / rect.h;
    let y = rect.y;
    for (const r of row) {
      const th = r.area / cw;
      out.push({ key: r.key, value: r.value, item: r.item, x: rect.x, y, w: cw, h: th });
      y += th;
    }
    return { x: rect.x + cw, y: rect.y, w: rect.w - cw, h: rect.h };
  }
  // row on top
  const rh = s / rect.w;
  let x = rect.x;
  for (const r of row) {
    const tw = r.area / rh;
    out.push({ key: r.key, value: r.value, item: r.item, x, y: rect.y, w: tw, h: rh });
    x += tw;
  }
  return { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh };
}

/** Lay out items (value > 0) in rect; tile area is proportional to value. */
export function squarify<T extends Sized>(items: T[], rect: Rect): Array<Tile<T>> {
  const pos = items.filter((i) => i.value > 0);
  const total = pos.reduce((a, i) => a + i.value, 0);
  if (!total || rect.w <= 0 || rect.h <= 0) {
    return [];
  }
  const scale = (rect.w * rect.h) / total;
  const rest: Array<Pending<T>> = pos
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((i) => ({ key: i.key, value: i.value, item: i, area: i.value * scale }));
  const out: Array<Tile<T>> = [];
  let row: Array<Pending<T>> = [];
  let r = { ...rect };
  while (rest.length) {
    const side = Math.min(r.w, r.h);
    if (!row.length || worst(row.concat([rest[0]]), side) <= worst(row, side)) {
      row.push(rest.shift()!);
    } else {
      r = placeRow(row, r, out);
      row = [];
    }
  }
  if (row.length) {
    placeRow(row, r, out);
  }
  return out;
}

/**
 * Raise small values so each tile gets at least its share of the total area.
 * share: one number for all tiles, or one per tile. Solves
 * T = sum(max(v_i, share_i * T)) by fixed point (converges while sum < 1).
 */
export function floorSizes(vals: number[], share: number | number[]): number[] {
  const sh = vals.map((_, i) => (Array.isArray(share) ? share[i] || 0 : share || 0));
  const sum = sh.reduce((a, b) => a + b, 0);
  if (!(sum > 0)) {
    return vals.slice();
  }
  if (sum >= 1) {
    return sh.map((x) => x / sum);
  }
  let T = vals.reduce((a, v) => a + v, 0);
  for (let k = 0; k < 100; k++) {
    T = vals.reduce((a, v, i) => a + Math.max(v, sh[i] * T), 0);
  }
  return vals.map((v, i) => Math.max(v, sh[i] * T));
}

/** Share of a W x H panel taken by one square tile of `side` px (the minimum tile size). */
export function minTileShare(side: number, W: number, H: number): number {
  if (!(side > 0) || W <= 0 || H <= 0) {
    return 0;
  }
  return (side * side) / (W * H);
}

export interface GroupBox extends Rect {
  key: string;
  header: boolean;
}

/**
 * Two-level treemap: lay out groups by their total size, then each group's
 * items inside its box, below a header strip when the box has room for one.
 */
export function groupLayout<T extends Sized & { group: string }>(
  items: T[],
  rect: Rect,
  headerH: number
): { groups: GroupBox[]; tiles: Array<Tile<T>> } {
  const byGroup = new Map<string, T[]>();
  for (const it of items) {
    if (!(it.value > 0)) {
      continue;
    }
    const list = byGroup.get(it.group) ?? [];
    list.push(it);
    byGroup.set(it.group, list);
  }
  const groupItems = [...byGroup.entries()].map(([key, list]) => ({
    key,
    value: list.reduce((a, i) => a + i.value, 0),
    list,
  }));
  const groups: GroupBox[] = [];
  const tiles: Array<Tile<T>> = [];
  for (const g of squarify(groupItems, rect)) {
    const header = g.h >= headerH * 2.5 && g.w >= 60;
    groups.push({ key: g.key, x: g.x, y: g.y, w: g.w, h: g.h, header });
    const inner = header ? { x: g.x, y: g.y + headerH, w: g.w, h: g.h - headerH } : { x: g.x, y: g.y, w: g.w, h: g.h };
    tiles.push(...squarify(g.item.list, inner));
  }
  return { groups, tiles };
}
