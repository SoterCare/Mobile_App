/**
 * AreaLineChart — react-native-svg + d3-shape
 *
 * - Red line/fill for body temperature
 * - Gray shaded rectangles for null (device off) gaps
 * - Null gaps: each contiguous non-null run is its own path (no bridging)
 * - Dynamic Y range expanded to actual data + 10% padding
 * - Period-aware X labels in local timezone
 * - Touch + drag tooltip with auto-flip when near right edge
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  PanResponder,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
  Line,
  Circle,
  Rect,
} from 'react-native-svg';
import { line, area, curveMonotoneX } from 'd3-shape';
import { VitalDataPoint, PeriodType } from '@/data/mockVitals';

interface AreaLineChartProps {
  data: VitalDataPoint[];
  unit: string;
  yAxisLabel: string;
  minValue: number;
  maxValue: number;
  period: PeriodType;
  height?: number;
  /** Show more X labels (used in fullscreen landscape). */
  dense?: boolean;
}

const CHART_LINE  = '#EF4444';   // red line
const CHART_AREA  = '#EF4444';   // red fill (low opacity)
const CHART_DOT   = '#DC2626';   // darker red dots
const NULL_COLOR  = '#9CA3AF';   // gray for device-off spans
const GRID_COLOR  = '#E4EAF0';
const LABEL_COLOR = '#9AABB8';

const PAD = { top: 20, right: 16, bottom: 34, left: 48 };

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtWeekMonthLabel(xLabel: string): string {
  const p = xLabel.split('-');
  if (p.length < 3) return xLabel;
  const m = MONTH_ABBR[parseInt(p[1], 10) - 1] ?? p[1];
  return `${m} ${parseInt(p[2], 10)}`;
}

/** Convert an xLabel from backend to a local-tz display string for day view. */
function fmtDayLabel(xLabel: string): string {
  // Backend may send "HH:MM" already — return as-is
  if (/^\d{1,2}:\d{2}$/.test(xLabel)) return xLabel;
  // Backend may send ISO string — convert to local HH:MM
  if (xLabel.includes('T') || xLabel.includes('Z')) {
    const d = new Date(xLabel);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  return xLabel;
}

type Pt = { value: number; index: number; xLabel: string };

const AreaLineChart: React.FC<AreaLineChartProps> = ({
  data,
  unit,
  yAxisLabel,
  minValue,
  maxValue,
  period,
  height = 180,
  dense = false,
}) => {
  const [chartWidth, setChartWidth] = useState(0);
  const [activeIdx, setActiveIdx]   = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  // ── Dynamic Y range ──────────────────────────────────────────────────────
  const { yMin, yMax } = useMemo(() => {
    const vals = data
      .filter(d => d.value !== null && d.value !== undefined)
      .map(d => Number(d.value));
    if (vals.length === 0) return { yMin: minValue, yMax: maxValue };
    const dMin = Math.min(...vals, minValue);
    const dMax = Math.max(...vals, maxValue);
    const range = dMax - dMin || 1;
    const pad   = range * 0.1;
    return { yMin: dMin - pad, yMax: dMax + pad };
  }, [data, minValue, maxValue]);

  const contentW = chartWidth - PAD.left - PAD.right;
  const contentH = height - PAD.top - PAD.bottom;

  const xScale = useCallback(
    (idx: number) => {
      const n = data.length;
      if (n <= 1) return PAD.left + contentW / 2;
      return PAD.left + (idx / (n - 1)) * contentW;
    },
    [data.length, contentW]
  );

  const yScale = useCallback(
    (v: number) => {
      const range = yMax - yMin || 1;
      return PAD.top + contentH * (1 - (v - yMin) / range);
    },
    [yMin, yMax, contentH]
  );

  // ── Contiguous non-null segments ─────────────────────────────────────────
  const segments = useMemo<Pt[][]>(() => {
    const result: Pt[][] = [];
    let cur: Pt[] = [];
    data.forEach((d, i) => {
      if (d.value !== null && d.value !== undefined) {
        cur.push({ value: Number(d.value), index: i, xLabel: d.xLabel });
      } else if (cur.length > 0) {
        result.push(cur);
        cur = [];
      }
    });
    if (cur.length > 0) result.push(cur);
    return result;
  }, [data]);

  // ── Null (device-off) ranges for gray shading ────────────────────────────
  const nullRanges = useMemo<Array<{ startIdx: number; endIdx: number }>>(() => {
    if (data.length === 0) return [];
    const ranges: Array<{ startIdx: number; endIdx: number }> = [];
    let inNull = false;
    let start  = 0;
    data.forEach((d, i) => {
      const isNull = d.value === null || d.value === undefined;
      if (isNull && !inNull) { inNull = true; start = i; }
      if (!isNull &&  inNull) { inNull = false; ranges.push({ startIdx: start, endIdx: i - 1 }); }
    });
    if (inNull) ranges.push({ startIdx: start, endIdx: data.length - 1 });
    return ranges;
  }, [data]);

  // ── X-axis labels ─────────────────────────────────────────────────────────
  const xLabels = useMemo(() => {
    const n = data.length;
    if (n === 0) return [];

    if (period === 'day') {
      const indices = dense
        ? [0,2,4,6,8,10,12,14,16,18,20,22].filter(i => i < n)
        : [0,4,8,12,16,20].filter(i => i < n);
      return indices.map(i => ({
        index: i,
        label: data[i]?.xLabel ? fmtDayLabel(data[i].xLabel) : `${String(i).padStart(2,'0')}:00`,
      }));
    }

    const count = dense ? n : Math.min(6, n);
    if (count === 1) return [{ index: 0, label: fmtWeekMonthLabel(data[0].xLabel) }];
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round(i * (n - 1) / (count - 1));
      return { index: idx, label: fmtWeekMonthLabel(data[idx]?.xLabel ?? '') };
    });
  }, [data, period, dense]);

  // ── Y-axis gridlines (4) ─────────────────────────────────────────────────
  const gridValues = useMemo(() => {
    const count = 4;
    return Array.from({ length: count }, (_, i) =>
      yMin + ((yMax - yMin) * i) / (count - 1)
    );
  }, [yMin, yMax]);

  // ── Touch / tooltip ──────────────────────────────────────────────────────
  const findClosestIdx = useCallback(
    (lx: number) => {
      const n = data.length;
      if (n <= 1) return 0;
      const frac = Math.max(0, Math.min(1, (lx - PAD.left) / contentW));
      return Math.round(frac * (n - 1));
    },
    [data.length, contentW]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => setActiveIdx(findClosestIdx(evt.nativeEvent.locationX)),
        onPanResponderMove: evt => setActiveIdx(findClosestIdx(evt.nativeEvent.locationX)),
        onPanResponderRelease: () => setActiveIdx(null),
        onPanResponderTerminate: () => setActiveIdx(null),
      }),
    [findClosestIdx]
  );

  const activePoint = useMemo(() => {
    if (activeIdx === null) return null;
    const d = data[activeIdx];
    if (d?.value === null || d?.value === undefined) return null;
    return {
      x: xScale(activeIdx),
      y: yScale(Number(d.value)),
      value: Number(d.value),
      xLabel: period === 'day' ? fmtDayLabel(d.xLabel) : fmtWeekMonthLabel(d.xLabel),
    };
  }, [activeIdx, data, xScale, yScale, period]);

  // ── d3 generators ────────────────────────────────────────────────────────
  const makeLinePath = useCallback(
    (seg: Pt[]) =>
      (line<Pt>()
        .x(d => xScale(d.index))
        .y(d => yScale(d.value))
        .curve(curveMonotoneX))(seg) ?? '',
    [xScale, yScale]
  );

  const makeAreaPath = useCallback(
    (seg: Pt[]) =>
      (area<Pt>()
        .x(d => xScale(d.index))
        .y0(PAD.top + contentH)
        .y1(d => yScale(d.value))
        .curve(curveMonotoneX))(seg) ?? '',
    [xScale, yScale, contentH]
  );

  if (chartWidth === 0) {
    return <View style={{ height, width: '100%' }} onLayout={onLayout} />;
  }

  const n = data.length;

  const hasNullGaps = nullRanges.length > 0;

  return (
    <View style={{ width: '100%' }} onLayout={onLayout}>
      <View style={{ height }}>
      {/* Touch capture overlay */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={CHART_AREA} stopOpacity={0.22} />
              <Stop offset="100%" stopColor={CHART_AREA} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {/* Gray device-off shaded areas */}
          {nullRanges.map((r, ri) => {
            // extend half a slot on each side for visual continuity
            const x1 = r.startIdx === 0
              ? PAD.left
              : (xScale(r.startIdx - 1) + xScale(r.startIdx)) / 2;
            const x2 = r.endIdx === n - 1
              ? chartWidth - PAD.right
              : (xScale(r.endIdx) + xScale(r.endIdx + 1)) / 2;
            return (
              <Rect
                key={ri}
                x={x1}
                y={PAD.top}
                width={x2 - x1}
                height={contentH}
                fill={NULL_COLOR}
                opacity={0.12}
              />
            );
          })}

          {/* Horizontal gridlines + Y labels */}
          {gridValues.map((val, gi) => {
            const y   = yScale(val);
            const lbl = val.toFixed(1);
            return (
              <G key={gi}>
                <Line
                  x1={PAD.left} y1={y}
                  x2={chartWidth - PAD.right} y2={y}
                  stroke={GRID_COLOR}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
                <SvgText
                  x={PAD.left - 6}
                  y={y + 4}
                  fontSize={9}
                  fill={LABEL_COLOR}
                  textAnchor="end"
                >
                  {lbl}
                </SvgText>
              </G>
            );
          })}

          {/* Y-axis label (rotated, left edge) */}
          <SvgText
            x={10}
            y={PAD.top + contentH / 2}
            fontSize={8}
            fill={LABEL_COLOR}
            textAnchor="middle"
            rotation="-90"
            originX={10}
            originY={PAD.top + contentH / 2}
          >
            {yAxisLabel}
          </SvgText>

          {/* Multi-segment area fill + red line */}
          {segments.map((seg, si) => (
            <G key={si}>
              <Path d={makeAreaPath(seg)} fill="url(#redGrad)" />
              <Path
                d={makeLinePath(seg)}
                stroke={CHART_LINE}
                strokeWidth={2.5}
                fill="none"
              />
            </G>
          ))}

          {/* Small dots on each non-null point */}
          {data.map((d, i) => {
            if (d.value === null || d.value === undefined) return null;
            return (
              <Circle
                key={i}
                cx={xScale(i)}
                cy={yScale(Number(d.value))}
                r={2.5}
                fill={CHART_DOT}
              />
            );
          })}

          {/* X-axis labels */}
          {xLabels.map(({ index, label }, li, arr) => {
            const isFirst  = li === 0;
            const isLast   = li === arr.length - 1;
            const anchor   = isFirst ? 'start' : isLast ? 'end' : 'middle';
            const x        = isFirst ? PAD.left : isLast ? chartWidth - PAD.right : xScale(index);
            return (
              <SvgText
                key={li}
                x={x}
                y={height - 6}
                fontSize={9}
                fill={LABEL_COLOR}
                textAnchor={anchor}
              >
                {label}
              </SvgText>
            );
          })}

          {/* No in-chart text for null gaps — legend shown below */}

          {/* Active tooltip */}
          {activePoint !== null && (() => {
            const { x, y, value, xLabel: xl } = activePoint;
            const TW = 88;
            const TH = 48;
            const flipLeft = x + TW + 14 > chartWidth - PAD.right;
            const tx = flipLeft ? x - TW - 10 : x + 10;
            const ty = Math.min(
              Math.max(PAD.top, y - TH / 2),
              PAD.top + contentH - TH
            );

            return (
              <G>
                <Line
                  x1={x} y1={PAD.top}
                  x2={x} y2={PAD.top + contentH}
                  stroke={CHART_LINE}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                  opacity={0.6}
                />
                <Circle cx={x} cy={y} r={7}  fill={CHART_LINE} opacity={0.18} />
                <Circle cx={x} cy={y} r={4}  fill={CHART_DOT} />
                <Circle cx={x} cy={y} r={2}  fill="#fff" />
                <Rect x={tx} y={ty} width={TW} height={TH} rx={9} fill="#1C2B3A" opacity={0.92} />
                <SvgText x={tx + TW / 2} y={ty + 17} fontSize={10} fill="#8FAABB" textAnchor="middle">
                  {xl}
                </SvgText>
                <SvgText x={tx + TW / 2} y={ty + 36} fontSize={15} fontWeight="700" fill="#ffffff" textAnchor="middle">
                  {value.toFixed(1)}{unit}
                </SvgText>
              </G>
            );
          })()}
        </Svg>
      </View>
      </View>

      {/* Legend: gray dot = device off */}
      {hasNullGaps && (
        <View style={styles.legendRow}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Device off</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 48,
    marginTop: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NULL_COLOR,
    opacity: 0.7,
  },
  legendText: {
    fontSize: 10,
    color: NULL_COLOR,
    fontWeight: '500',
  },
});

export default AreaLineChart;
