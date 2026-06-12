/**
 * AreaLineChart — react-native-svg + d3-shape
 *
 * Features:
 * - Null gaps: each contiguous non-null run becomes its own path segment (no bridging)
 * - Dynamic Y range expanded to actual data + 10% padding
 * - Period-aware X labels (day → every 4 h, others → up to 6 "MMM DD")
 * - Touch + drag tooltip with auto-flip when near right edge
 * - Crosshair vertical line + dot highlight on active point
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
import { Colors } from '@/theme/tokens';
import { VitalDataPoint, PeriodType } from '@/data/mockVitals';

interface AreaLineChartProps {
  data: VitalDataPoint[];
  unit: string;
  yAxisLabel: string;
  minValue: number;
  maxValue: number;
  period: PeriodType;
  height?: number;
  /** Show all X labels (used in fullscreen). */
  dense?: boolean;
}

const CHART_COLOR = Colors.brand;        // '#91D7E4'
const CHART_DARK  = Colors.brandDark;    // '#6BC4DB'
const GRID_COLOR  = '#E4EAF0';
const LABEL_COLOR = '#9AABB8';

const PAD = { top: 20, right: 16, bottom: 34, left: 48 };

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtWeekMonthLabel(xLabel: string): string {
  // 'YYYY-MM-DD' → 'MMM D'
  const p = xLabel.split('-');
  if (p.length < 3) return xLabel;
  const m = MONTH_ABBR[parseInt(p[1], 10) - 1] ?? p[1];
  return `${m} ${parseInt(p[2], 10)}`;
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
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  // ---------- Dynamic Y range ----------
  const { yMin, yMax } = useMemo(() => {
    const vals = data
      .filter(d => d.value !== null && d.value !== undefined)
      .map(d => Number(d.value));
    if (vals.length === 0) return { yMin: minValue, yMax: maxValue };
    const dMin = Math.min(...vals, minValue);
    const dMax = Math.max(...vals, maxValue);
    const range = dMax - dMin || 1;
    const pad = range * 0.1;
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

  // ---------- Contiguous non-null segments ----------
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

  // ---------- X-axis labels ----------
  const xLabels = useMemo(() => {
    const n = data.length;
    if (n === 0) return [];

    if (period === 'day') {
      // One label every 4 hours: index 0,4,8,12,16,20
      const indices = dense
        ? [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].filter(i => i < n)
        : [0, 4, 8, 12, 16, 20].filter(i => i < n);
      return indices.map(i => ({
        index: i,
        label: data[i]?.xLabel ?? `${String(i).padStart(2, '0')}:00`,
      }));
    }

    // Week / Month / Custom — up to 6 labels, formatted "MMM D"
    const count = dense ? n : Math.min(6, n);
    if (count === 1) return [{ index: 0, label: fmtWeekMonthLabel(data[0].xLabel) }];
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round(i * (n - 1) / (count - 1));
      return { index: idx, label: fmtWeekMonthLabel(data[idx]?.xLabel ?? '') };
    });
  }, [data, period, dense]);

  // ---------- Y-axis gridlines (4) ----------
  const gridValues = useMemo(() => {
    const count = 4;
    return Array.from({ length: count }, (_, i) =>
      yMin + ((yMax - yMin) * i) / (count - 1)
    );
  }, [yMin, yMax]);

  // ---------- Touch / tooltip ----------
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
      xLabel: d.xLabel,
    };
  }, [activeIdx, data, xScale, yScale]);

  // ---------- d3 generators ----------
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

  // ---------- Render ----------
  return (
    <View style={{ height, width: '100%' }} onLayout={onLayout}>
      {/* Rotated Y-axis label */}
      <View style={[styles.yLabelWrap, { bottom: PAD.bottom }]}>
        <Text style={styles.yLabel}>{yAxisLabel}</Text>
      </View>

      {/* Touch capture overlay */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%"   stopColor={CHART_COLOR} stopOpacity={0.28} />
              <Stop offset="100%" stopColor={CHART_COLOR} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>

          {/* Horizontal gridlines + Y labels */}
          {gridValues.map((val, gi) => {
            const y = yScale(val);
            const lbl =
              Math.abs(val) < 10
                ? val.toFixed(1)
                : val % 1 === 0
                ? String(Math.round(val))
                : val.toFixed(1);
            return (
              <G key={gi}>
                <Line
                  x1={PAD.left}
                  y1={y}
                  x2={chartWidth - PAD.right}
                  y2={y}
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

          {/* Multi-segment area fill + line */}
          {segments.map((seg, si) => (
            <G key={si}>
              <Path d={makeAreaPath(seg)} fill="url(#areaGrad)" />
              <Path
                d={makeLinePath(seg)}
                stroke={CHART_DARK}
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
                fill={CHART_COLOR}
              />
            );
          })}

          {/* X-axis labels */}
          {xLabels.map(({ index, label }, li, arr) => {
            const isFirst = li === 0;
            const isLast = li === arr.length - 1;
            const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
            const x = isFirst
              ? PAD.left
              : isLast
              ? chartWidth - PAD.right
              : xScale(index);
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

          {/* Active point + tooltip */}
          {activePoint !== null && (() => {
            const { x, y, value, xLabel: xl } = activePoint;
            const TW = 92;
            const TH = 48;
            const flipLeft = x + TW + 14 > chartWidth - PAD.right;
            const tx = flipLeft ? x - TW - 10 : x + 10;
            const ty = Math.min(
              Math.max(PAD.top, y - TH / 2),
              PAD.top + contentH - TH
            );

            return (
              <G>
                {/* Vertical crosshair */}
                <Line
                  x1={x}
                  y1={PAD.top}
                  x2={x}
                  y2={PAD.top + contentH}
                  stroke={CHART_DARK}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                  opacity={0.6}
                />
                {/* Halo + dot */}
                <Circle cx={x} cy={y} r={7}  fill={CHART_COLOR} opacity={0.2} />
                <Circle cx={x} cy={y} r={4}  fill={CHART_DARK} />
                <Circle cx={x} cy={y} r={2}  fill="#fff" />
                {/* Tooltip box */}
                <Rect
                  x={tx}
                  y={ty}
                  width={TW}
                  height={TH}
                  rx={9}
                  fill="#1C2B3A"
                  opacity={0.92}
                />
                <SvgText
                  x={tx + TW / 2}
                  y={ty + 17}
                  fontSize={10}
                  fill="#8FAABB"
                  textAnchor="middle"
                >
                  {xl}
                </SvgText>
                <SvgText
                  x={tx + TW / 2}
                  y={ty + 36}
                  fontSize={15}
                  fontWeight="700"
                  fill="#ffffff"
                  textAnchor="middle"
                >
                  {value.toFixed(1)}{unit}
                </SvgText>
              </G>
            );
          })()}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  yLabelWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  yLabel: {
    fontSize: 8,
    color: LABEL_COLOR,
    transform: [{ rotate: '-90deg' }],
    width: 120,
    textAlign: 'center',
  },
});

export default AreaLineChart;
