import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { DisplayValue, Field, FieldType, GrafanaTheme2, PanelProps, formattedValueToString } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import { PanelDataErrorView } from '@grafana/runtime';
import { DockerTreeOptions } from '../types';
import { collect, Row } from '../lib/data';
import { floorSizes, groupLayout, nameShares, squarify, GroupBox, Tile } from '../lib/layout';
import { fmtBits, fmtBytes, GAP, labelFit, LINE_H, statLine } from '../lib/label';

interface Props extends PanelProps<DockerTreeOptions> {}

type Item = Row & { key: string; load: number; group: string };

const HEADER_H = 18;

export const DockerTreePanel: React.FC<Props> = ({ options, data, width, height, fieldConfig, id }) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const [hover, setHover] = useState<{ item: Item; x: number; y: number } | null>(null);

  const map = useMemo(
    () => ({
      size: options.sizeQuery,
      memory: options.memoryQuery,
      network: options.networkQuery,
      nameField: options.nameField || 'name',
      groupField: options.groupField || 'stack',
    }),
    [options.sizeQuery, options.memoryQuery, options.networkQuery, options.nameField, options.groupField]
  );

  const rows = useMemo(() => collect(data.series, map), [data.series, map]);

  // Grafana's display processor for the size field: applies Unit, Decimals and Thresholds.
  const display = useMemo(() => {
    const frame = data.series.find((f) => f.refId === map.size) ?? data.series[0];
    const field: Field | undefined = frame?.fields.find((f) => f.type === FieldType.number);
    return (v: number): DisplayValue =>
      field?.display ? field.display(v) : { numeric: v, text: String(v), color: theme.colors.primary.main };
  }, [data.series, map.size, theme]);

  const layout = useMemo(() => {
    const shares = nameShares(
      rows.map((r) => r.name),
      width,
      height,
      options.minNameFont
    );
    const sizes = floorSizes(
      rows.map((r) => r.value),
      shares
    );
    const items: Item[] = rows.map((r, i) => ({ ...r, key: r.name, load: r.value, value: sizes[i] }));
    const rect = { x: 0, y: 0, w: width, h: height };
    if (options.groupByStack) {
      return groupLayout(items, rect, HEADER_H);
    }
    return { groups: [] as GroupBox[], tiles: squarify(items, rect) };
  }, [rows, width, height, options.minNameFont, options.groupByStack]);

  if (!rows.length) {
    return <PanelDataErrorView fieldConfig={fieldConfig} panelId={id} data={data} needsStringField needsNumberField />;
  }

  const hoverCard = hover ? renderHover(hover, display, width, height, styles) : null;

  return (
    <div className={styles.wrapper} style={{ width, height }} onMouseLeave={() => setHover(null)}>
      {layout.groups.map((g) => (
        <div
          key={'g-' + g.key}
          className={styles.group}
          style={{ left: g.x + GAP / 2, top: g.y + GAP / 2, width: g.w - GAP, height: g.h - GAP }}
        >
          {g.header && <div className={styles.groupHeader}>{g.key}</div>}
        </div>
      ))}
      {layout.tiles.map((t) => renderTile(t, display, theme, options, styles, setHover))}
      {hoverCard}
    </div>
  );
};

function renderTile(
  t: Tile<Item>,
  display: (v: number) => DisplayValue,
  theme: GrafanaTheme2,
  options: DockerTreeOptions,
  styles: ReturnType<typeof getStyles>,
  setHover: (h: { item: Item; x: number; y: number } | null) => void
) {
  const it = t.item;
  const dv = display(it.load);
  const bg = theme.visualization.getColorByName(dv.color ?? 'green');
  const fg = theme.colors.getContrastText(bg);
  const w = Math.max(0, t.w - GAP);
  const h = Math.max(0, t.h - GAP);
  const fit = labelFit(w, h, it.name);
  const statFont = fit ? Math.min(12, fit.font) : 12;
  const spare = fit && !fit.vertical ? h - 6 - fit.font * LINE_H : 0;
  const memText = options.memoryQuery && it.mem !== undefined ? fmtBytes(it.mem) : undefined;
  const big = w > 110 && h > 44;
  return (
    <div
      key={it.key}
      className={styles.tile}
      data-testid="dockertree-tile"
      style={{
        left: t.x + GAP / 2,
        top: t.y + GAP / 2,
        width: w,
        height: h,
        background: bg,
        color: fg,
        writingMode: fit?.vertical ? 'vertical-rl' : 'horizontal-tb',
      }}
      onMouseMove={(e) => {
        const box = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
        setHover({ item: it, x: e.clientX - box.left, y: e.clientY - box.top });
      }}
    >
      {fit && (
        <>
          <div className={styles.name} style={{ fontSize: fit.font }}>
            {it.name}
          </div>
          {options.showStats && spare >= 13 && (
            <div className={styles.stat} style={{ fontSize: statFont }}>
              {statLine(options.valueLabel, formattedValueToString(dv), memText, w, statFont)}
            </div>
          )}
          {options.showStats && !options.groupByStack && big && spare >= 28 && (
            <div className={styles.group2}>{it.group}</div>
          )}
        </>
      )}
    </div>
  );
}

function renderHover(
  hover: { item: Item; x: number; y: number },
  display: (v: number) => DisplayValue,
  width: number,
  height: number,
  styles: ReturnType<typeof getStyles>
) {
  const it = hover.item;
  const cardW = 220;
  const cardH = 110;
  const left = hover.x + 14 + cardW > width ? hover.x - cardW - 10 : hover.x + 14;
  const top = Math.min(Math.max(4, hover.y + 14), Math.max(4, height - cardH));
  return (
    <div className={styles.card} style={{ left: Math.max(4, left), top }} data-testid="dockertree-hover">
      <div className={styles.cardTitle}>{it.name}</div>
      <div className={styles.cardRow}>
        <span>Group</span>
        <span>{it.group}</span>
      </div>
      <div className={styles.cardRow}>
        <span>Load</span>
        <span>{formattedValueToString(display(it.load))}</span>
      </div>
      {it.mem !== undefined && (
        <div className={styles.cardRow}>
          <span>Mem</span>
          <span>{fmtBytes(it.mem)}</span>
        </div>
      )}
      {it.net !== undefined && (
        <div className={styles.cardRow}>
          <span>Network</span>
          <span>{fmtBits(it.net)}</span>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({ position: 'relative', overflow: 'hidden' }),
  group: css({
    position: 'absolute',
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.secondary,
  }),
  groupHeader: css({
    height: HEADER_H,
    lineHeight: `${HEADER_H}px`,
    padding: theme.spacing(0, 0.75),
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  tile: css({
    position: 'absolute',
    boxSizing: 'border-box',
    padding: 3,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
    lineHeight: LINE_H,
    cursor: 'default',
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 55%)',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)',
    [theme.transitions.handleMotion('no-preference', 'reduce')]: {
      transition: 'left .4s, top .4s, width .4s, height .4s, background-color .4s, filter .15s',
    },
    '&:hover': { filter: 'brightness(1.12)' },
  }),
  name: css({
    fontWeight: theme.typography.fontWeightBold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  stat: css({ whiteSpace: 'nowrap', overflow: 'hidden', opacity: 0.9 }),
  group2: css({ fontSize: 11, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
  card: css({
    position: 'absolute',
    zIndex: 2,
    width: 220,
    pointerEvents: 'none',
    padding: theme.spacing(1, 1.5),
    background: theme.colors.background.elevated,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    boxShadow: theme.shadows.z3,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  cardTitle: css({ fontWeight: theme.typography.fontWeightBold, marginBottom: theme.spacing(0.5) }),
  cardRow: css({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    color: theme.colors.text.secondary,
    '& > span:last-child': { color: theme.colors.text.primary },
  }),
});
