import { FieldType, toDataFrame } from '@grafana/data';
import { collect } from './data';

const frame = (refId: string, rows: Array<[string, string, number]>) =>
  toDataFrame({
    refId,
    fields: [
      { name: 'name', type: FieldType.string, values: rows.map((r) => r[0]) },
      { name: 'stack', type: FieldType.string, values: rows.map((r) => r[1]) },
      { name: 'Value', type: FieldType.number, values: rows.map((r) => r[2]) },
    ],
  });

const MAP = { size: 'A', memory: 'B', network: 'C', nameField: 'name', groupField: 'stack' };

describe('collect', () => {
  it('joins size, memory and network by container name; one row per name', () => {
    const rows = collect(
      [
        frame('A', [
          ['home-assistant', 'smarthome', 22.5],
          ['caddy', 'caddy', 0.5],
        ]),
        frame('B', [
          ['home-assistant', 'smarthome', 1.2e9],
          ['caddy', 'caddy', 5e7],
        ]),
        frame('C', [['home-assistant', 'smarthome', 2e6]]),
      ],
      MAP
    );
    expect(rows).toHaveLength(2);
    const s = rows.find((r) => r.name === 'home-assistant')!;
    expect([s.group, s.value, s.mem, s.net]).toEqual(['smarthome', 22.5, 1.2e9, 2e6]);
    expect(rows.find((r) => r.name === 'caddy')!.net).toBeUndefined();
  });

  it('reads time-series frames (labels on the value field); missing group becomes "–"', () => {
    const rows = collect(
      [
        toDataFrame({
          refId: 'A',
          fields: [
            { name: 'Time', type: FieldType.time, values: [1, 2] },
            { name: 'Value', type: FieldType.number, labels: { name: 'adhoc' }, values: [3, 4] },
          ],
        }),
      ],
      MAP
    );
    expect(rows.map((r) => [r.name, r.group, r.value])).toEqual([['adhoc', '–', 4]]);
  });

  it('uses the first query as size when the configured one is missing', () => {
    const rows = collect([frame('X', [['a', 's', 1]])], MAP);
    expect(rows).toHaveLength(1);
  });
});
