# Changelog

## 1.0.0

Initial release.

- Squarified treemap of containers: tile size and colour from one query (e.g. load), using Grafana's standard Unit, Decimals and Thresholds options.
- Readable names: tiles are made big enough for the full container name on one line (configurable size; 0 = size strictly by value).
- Each tile shows "Load: … · Mem: …" when there is room; hover card with group, load, memory and network.
- Optional grouping into one box per compose stack.
- Works with Prometheus/cAdvisor out of the box; any data source returning one row per container works.
