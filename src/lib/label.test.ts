import { labelFit, statLine, fmtLoad } from './label';

describe('labelFit', () => {
  it('uses one line only; full name at 10-14px or marks it clipped', () => {
    let f = labelFit(200, 40, 'nginx-proxy-manager');
    expect(f).not.toBeNull();
    expect(f!.vertical).toBe(false);
    expect(f!.clipped).toBeFalsy();
    expect(f!.font).toBeGreaterThanOrEqual(10);
    expect(f!.font).toBeLessThanOrEqual(14);
    expect(f!.font * 0.6 * 'nginx-proxy-manager'.length).toBeLessThanOrEqual(200 - 6);
    f = labelFit(30, 160, 'osync-postgres-1');
    expect(f!.vertical).toBe(true);
    expect(labelFit(14, 10, 'caddy')).toBeNull();
    f = labelFit(60, 40, 'audiobookshelf');
    expect(f!.clipped).toBe(true);
  });
});

describe('statLine', () => {
  it('labels the value and Mem, dropping Mem then the label as the tile narrows', () => {
    expect(statLine('Load', '20%', '1.5 GB', 400, 12)).toBe('Load: 20%  ·  Mem: 1.5 GB');
    expect(statLine('Load', '20%', '1.5 GB', 90, 12)).toBe('Load: 20%');
    expect(statLine('Load', '<0.1%', undefined, 400, 12)).toBe('Load: <0.1%');
    expect(statLine('Load', '20%', '1 GB', 40, 12)).toBe('20%');
    expect(statLine('', '20%', undefined, 400, 12)).toBe('20%');
  });
});

describe('fmtLoad', () => {
  it('formats small, medium and large loads', () => {
    expect(fmtLoad(0.05)).toBe('<0.1%');
    expect(fmtLoad(3.14)).toBe('3.1%');
    expect(fmtLoad(19.7)).toBe('20%');
  });
});
