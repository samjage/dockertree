import { squarify, floorSizes, minTileShare, groupLayout } from './layout';

describe('squarify', () => {
  it('fills the rect, stays inside it, areas proportional', () => {
    const items = [6, 6, 4, 3, 2, 2, 1].map((v, i) => ({ key: 'c' + i, value: v }));
    const W = 600,
      H = 400;
    const tiles = squarify(items, { x: 0, y: 0, w: W, h: H });
    expect(tiles).toHaveLength(items.length);
    const total = items.reduce((s, i) => s + i.value, 0);
    let area = 0;
    for (const t of tiles) {
      expect(t.x).toBeGreaterThanOrEqual(-1e-6);
      expect(t.y).toBeGreaterThanOrEqual(-1e-6);
      expect(t.x + t.w).toBeLessThanOrEqual(W + 1e-6);
      expect(t.y + t.h).toBeLessThanOrEqual(H + 1e-6);
      expect(Math.abs(t.w * t.h - (t.value / total) * W * H)).toBeLessThan(1e-6 * W * H);
      area += t.w * t.h;
    }
    expect(Math.abs(area - W * H)).toBeLessThan(1e-3);
  });

  it('never overlaps', () => {
    const items = Array.from({ length: 49 }, (_, i) => ({ key: 'c' + i, value: 0.5 + (i % 7) * 3 }));
    const t = squarify(items, { x: 0, y: 0, w: 1200, h: 500 });
    for (let i = 0; i < t.length; i++) {
      for (let j = i + 1; j < t.length; j++) {
        const a = t[i],
          b = t[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(ox <= 1e-6 || oy <= 1e-6).toBe(true);
      }
    }
  });

  it('gives no tiles for empty or zero-total input', () => {
    expect(squarify([], { x: 0, y: 0, w: 10, h: 10 })).toEqual([]);
    expect(squarify([{ key: 'a', value: 0 }], { x: 0, y: 0, w: 10, h: 10 })).toEqual([]);
  });

  it('keeps the caller item on each tile', () => {
    const t = squarify([{ key: 'a', value: 1, extra: 42 }], { x: 0, y: 0, w: 10, h: 10 });
    expect(t[0].item.extra).toBe(42);
  });
});

describe('floorSizes', () => {
  it('gives every tile at least `share` of the total; big ones unchanged', () => {
    const vals = [19.7, 3, 0.5].concat(Array(46).fill(0.05));
    const sizes = floorSizes(vals, 0.006);
    const total = sizes.reduce((a, b) => a + b, 0);
    for (const s of sizes) {
      expect(s / total).toBeGreaterThanOrEqual(0.006 - 1e-9);
    }
    expect(sizes[0]).toBe(19.7);
    expect(sizes[0] > sizes[1] && sizes[1] > sizes[2]).toBe(true);
  });

  it('honours per-tile shares', () => {
    const sizes = floorSizes([10, 0.01, 0.01], [0, 0.05, 0.2]);
    const T = sizes.reduce((a, b) => a + b, 0);
    expect(sizes[1] / T).toBeGreaterThanOrEqual(0.05 - 1e-9);
    expect(sizes[2] / T).toBeGreaterThanOrEqual(0.2 - 1e-9);
    expect(sizes[0]).toBe(10);
  });

  it('share 0 leaves values alone; an impossible share stays finite', () => {
    expect(floorSizes([5, 1], 0)).toEqual([5, 1]);
    expect(floorSizes([5, 1, 1], 0.5).every(Number.isFinite)).toBe(true);
  });
});

describe('minTileShare', () => {
  it('is the share of the panel taken by one minimum-size square tile', () => {
    expect(minTileShare(80, 800, 400)).toBeCloseTo((80 * 80) / (800 * 400));
    expect(minTileShare(0, 800, 400)).toBe(0);
    expect(minTileShare(80, 0, 400)).toBe(0);
  });

  it('with the same minimum for all, tiles above it stay proportional to load', () => {
    const vals = [20, 10, 5, 0.01, 0.01, 0.01];
    const sizes = floorSizes(vals, minTileShare(80, 1000, 500));
    expect(sizes[0] / sizes[1]).toBeCloseTo(2);
    expect(sizes[1] / sizes[2]).toBeCloseTo(2);
    expect(sizes[3]).toBeCloseTo(sizes[4]);
    expect(sizes[3]).toBeGreaterThan(0.01);
  });
});

describe('groupLayout', () => {
  const items = [
    { key: 'a1', value: 10, group: 'A' },
    { key: 'a2', value: 5, group: 'A' },
    { key: 'b1', value: 8, group: 'B' },
    { key: 'c1', value: 1, group: 'C' },
  ];
  const rect = { x: 0, y: 0, w: 800, h: 400 };

  it('puts every tile inside its group box, below the header, with no overlaps', () => {
    const { groups, tiles } = groupLayout(items, rect, 18);
    expect(groups.map((g) => g.key).sort()).toEqual(['A', 'B', 'C']);
    expect(tiles).toHaveLength(4);
    for (const t of tiles) {
      const g = groups.find((x) => x.key === t.item.group)!;
      expect(t.x).toBeGreaterThanOrEqual(g.x - 1e-6);
      expect(t.x + t.w).toBeLessThanOrEqual(g.x + g.w + 1e-6);
      expect(t.y + t.h).toBeLessThanOrEqual(g.y + g.h + 1e-6);
      if (g.header) {
        expect(t.y).toBeGreaterThanOrEqual(g.y + 18 - 1e-6);
      }
    }
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        const a = tiles[i],
          b = tiles[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(ox <= 1e-6 || oy <= 1e-6).toBe(true);
      }
    }
  });

  it('skips the header on group boxes too small for one', () => {
    const { groups } = groupLayout([{ key: 'x', value: 1, group: 'G' }], { x: 0, y: 0, w: 50, h: 20 }, 18);
    expect(groups[0].header).toBe(false);
  });
});
