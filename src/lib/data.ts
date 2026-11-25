/** Turn Grafana data frames into one row per container. */
import { DataFrame, FieldType } from '@grafana/data';

export interface QueryMap {
  size: string; // refId giving tile size and colour (e.g. load)
  memory: string; // refId giving memory bytes (optional)
  network: string; // refId giving network bits/s (optional)
  nameField: string; // label/field holding the container name
  groupField: string; // label/field holding the group (e.g. compose stack)
}

export interface Row {
  name: string;
  group: string;
  value: number;
  mem?: number;
  net?: number;
}

/** Group shown for containers without a group label (e.g. not started by Docker Compose). */
export const NO_GROUP = 'no stack';

interface Raw {
  name: string;
  group: string;
  v: number;
}

function rowsOf(frame: DataFrame, map: QueryMap): Raw[] {
  const fields = frame.fields;
  const nameF = fields.find((f) => f.name === map.nameField);
  const groupF = fields.find((f) => f.name === map.groupField);
  const nums = fields.filter((f) => f.type === FieldType.number);
  const out: Raw[] = [];
  if (nameF) {
    // table format: one row per container
    const valF = nums[nums.length - 1];
    for (let i = 0; i < frame.length; i++) {
      out.push({
        name: String(nameF.values[i]),
        group: groupF ? String(groupF.values[i] ?? '') : '',
        v: valF ? Number(valF.values[i]) : NaN,
      });
    }
    return out;
  }
  // time-series format: labels on each value field; take the last point
  for (const f of nums) {
    const labels = f.labels ?? {};
    const name = labels[map.nameField];
    if (!name) {
      continue;
    }
    out.push({ name, group: labels[map.groupField] ?? '', v: Number(f.values[f.values.length - 1]) });
  }
  return out;
}

export function collect(series: DataFrame[], map: QueryMap): Row[] {
  const byName = new Map<string, Row>();
  const order: string[] = [];
  const hasSize = series.some((f) => f.refId === map.size);
  const sizeRef = hasSize ? map.size : series[0]?.refId;
  const prop: Record<string, 'value' | 'mem' | 'net'> = {};
  if (sizeRef !== undefined) {
    prop[sizeRef] = 'value';
  }
  if (map.memory && map.memory !== sizeRef) {
    prop[map.memory] = 'mem';
  }
  if (map.network && map.network !== sizeRef) {
    prop[map.network] = 'net';
  }
  for (const frame of series) {
    const p = prop[frame.refId ?? ''];
    if (!p) {
      continue;
    }
    for (const r of rowsOf(frame, map)) {
      let row = byName.get(r.name);
      if (!row) {
        row = { name: r.name, group: NO_GROUP, value: NaN };
        byName.set(r.name, row);
        order.push(r.name);
      }
      if (r.group) {
        row.group = r.group;
      }
      if (!Number.isNaN(r.v)) {
        row[p] = r.v;
      }
    }
  }
  return order.map((n) => byName.get(n)!).filter((r) => Number.isFinite(r.value));
}
