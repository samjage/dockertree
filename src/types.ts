export interface DockerTreeOptions {
  /** refId of the query that sets tile size and colour (e.g. load). */
  sizeQuery: string;
  /** refId of the query giving memory bytes (optional). */
  memoryQuery: string;
  /** refId of the query giving network bits/s (optional). */
  networkQuery: string;
  /** Label or field holding the container name. */
  nameField: string;
  /** Label or field holding the group (e.g. compose stack). */
  groupField: string;
  /** Draw tiles inside one box per group. */
  groupByStack: boolean;
  /** Give each tile room for its full name at this font size (px). 0 = size by value only. */
  minNameFont: number;
  /** Word shown before the value on each tile, e.g. "Load". */
  valueLabel: string;
  /** Show the value / memory line under the name. */
  showStats: boolean;
}
