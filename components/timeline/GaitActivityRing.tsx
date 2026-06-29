/**
 * GaitActivityRing — a 24-hour clock ring of gait states for the Timeline tab.
 *
 * 00:00 at top, clockwise. Sustained states are arcs, posture transitions are
 * dots, "device off" is a recessive dashed gray groove. Tap a segment or a
 * legend chip to drill the hollow center; a per-state breakdown sits below.
 *
 * Drawing matches the app's existing approach (react-native-svg), light-only.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ViewStyle, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { Colors, Radius, Spacing } from '@/theme/tokens';
import { TimelineColors } from '@/theme/colors';
import { Shadows } from '@/theme/shadows';
import {
  Segment,
  GaitState,
  GAIT_CONFIG,
  GAIT_ORDER,
  DAY_SECONDS,
  totalsByState,
  formatDuration,
  formatClock,
  angleForSec,
  describeArc,
  polarToCartesian,
} from '@/utils/gaitSegments';

interface Props {
  segments: Segment[];
  /** e.g. "Today" or "2026-06-24" — shown under the headline metric. */
  dayLabel?: string;
  /** Seconds-since-midnight for a subtle "now" marker (today only). */
  nowSec?: number | null;
  /** Optional affordance to jump to the detailed activity list. */
  onPressDetails?: () => void;
  style?: ViewStyle;
}

const STROKE = 16;

export const GaitActivityRing: React.FC<Props> = ({
  segments,
  dayLabel,
  nowSec,
  onPressDetails,
  style,
}) => {
  const { width: screenW } = useWindowDimensions();
  const size = Math.min(screenW - 32 - 40, 300); // card padding + breathing room
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 46; // leave room outside for ticks + hour labels (no clipping)

  const totals = useMemo(() => totalsByState(segments), [segments]);
  const hasData = useMemo(
    () => segments.some((s) => s.state !== 'device_off' && s.endSec > s.startSec),
    [segments],
  );

  // Selection: a specific tapped arc, OR a state highlighted via a legend chip.
  const [activeSeg, setActiveSeg] = useState<Segment | null>(null);
  const [activeState, setActiveState] = useState<GaitState | null>(null);

  const reset = () => {
    setActiveSeg(null);
    setActiveState(null);
  };
  const selectSeg = (seg: Segment) => {
    setActiveState(null);
    setActiveSeg((cur) => (cur === seg ? null : seg));
  };
  const toggleState = (s: GaitState) => {
    setActiveSeg(null);
    setActiveState((cur) => (cur === s ? null : s));
  };

  const dimOthers = activeState != null;
  const opacityFor = (s: GaitState) => (dimOthers && s !== activeState ? 0.15 : 1);

  // ── Arcs (sustained + device_off) and transition dots ──────────────────────
  const arcs: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  segments.forEach((seg, i) => {
    const meta = GAIT_CONFIG[seg.state];
    const startDeg = angleForSec(seg.startSec);
    const endDeg = angleForSec(seg.endSec);

    if (meta.kind === 'transition') {
      const mid = polarToCartesian(cx, cy, R, (startDeg + endDeg) / 2);
      dots.push(
        <Circle
          key={`d${i}`}
          cx={mid.x}
          cy={mid.y}
          r={5}
          fill={meta.color}
          opacity={opacityFor(seg.state)}
          onPress={() => selectSeg(seg)}
        />,
      );
      return;
    }

    const isOff = seg.state === 'device_off';
    const emphasized = activeSeg === seg;
    arcs.push(
      <Path
        key={`a${i}`}
        d={describeArc(cx, cy, R, startDeg, endDeg)}
        stroke={meta.color}
        strokeWidth={emphasized ? STROKE + 4 : STROKE}
        strokeLinecap="butt"
        fill="none"
        opacity={isOff ? (dimOthers && activeState !== 'device_off' ? 0.1 : 0.32) : opacityFor(seg.state)}
        strokeDasharray={isOff ? '2 5' : undefined}
        onPress={() => !isOff && selectSeg(seg)}
      />,
    );
  });

  // ── Hour ticks (00/06/12/18 long + labeled, rest short) ────────────────────
  const ticks: React.ReactNode[] = [];
  for (let h = 0; h < 24; h++) {
    const deg = (h / 24) * 360;
    const major = h % 6 === 0;
    const inner = polarToCartesian(cx, cy, R + STROKE / 2 + 3, deg);
    const outer = polarToCartesian(cx, cy, R + STROKE / 2 + (major ? 9 : 4), deg);
    ticks.push(
      <Line
        key={`t${h}`}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        stroke={major ? TimelineColors.textMedium : TimelineColors.borderLight}
        strokeWidth={major ? 1.5 : 1}
      />,
    );
    if (major) {
      const lp = polarToCartesian(cx, cy, R + STROKE / 2 + 22, deg);
      ticks.push(
        <SvgText
          key={`tl${h}`}
          x={lp.x}
          y={lp.y + 4}
          fill={TimelineColors.textMedium}
          fontSize={11}
          fontWeight="600"
          textAnchor="middle"
        >
          {String(h).padStart(2, '0')}
        </SvgText>,
      );
    }
  }

  // ── Now marker ─────────────────────────────────────────────────────────────
  let nowMarker: React.ReactNode = null;
  if (nowSec != null && nowSec >= 0 && nowSec <= DAY_SECONDS) {
    const deg = angleForSec(nowSec);
    const a = polarToCartesian(cx, cy, R - STROKE / 2 - 2, deg);
    const b = polarToCartesian(cx, cy, R + STROKE / 2 + 2, deg);
    nowMarker = <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={Colors.textPrimary} strokeWidth={2} />;
  }

  // ── Center content ─────────────────────────────────────────────────────────
  let center: React.ReactNode;
  if (activeSeg) {
    const meta = GAIT_CONFIG[activeSeg.state];
    center = (
      <>
        <Text style={[styles.centerTitle, { color: meta.color }]} numberOfLines={1}>
          {meta.label}
        </Text>
        <Text style={styles.centerBig}>{formatDuration(activeSeg.endSec - activeSeg.startSec)}</Text>
        <Text style={styles.centerSub}>
          {formatClock(activeSeg.startSec)}–{formatClock(activeSeg.endSec)}
        </Text>
      </>
    );
  } else if (activeState) {
    const meta = GAIT_CONFIG[activeState];
    center = (
      <>
        <Text style={[styles.centerTitle, { color: meta.color }]} numberOfLines={1}>
          {meta.label}
        </Text>
        <Text style={styles.centerBig}>{formatDuration(totals[activeState])}</Text>
        <Text style={styles.centerSub}>today</Text>
      </>
    );
  } else if (hasData) {
    center = (
      <>
        <Text style={styles.centerBig}>{formatDuration(totals.walking)}</Text>
        <Text style={styles.centerSub}>time on feet</Text>
        {!!dayLabel && <Text style={styles.centerDay}>{dayLabel}</Text>}
      </>
    );
  } else {
    center = (
      <>
        <Text style={styles.centerTitle}>No activity</Text>
        <Text style={styles.centerSub}>recorded</Text>
        {!!dayLabel && <Text style={styles.centerDay}>{dayLabel}</Text>}
      </>
    );
  }

  const a11yLabel = useMemo(() => {
    const parts = GAIT_ORDER.filter((s) => totals[s] > 0).map(
      (s) => `${GAIT_CONFIG[s].label} ${formatDuration(totals[s])}`,
    );
    return `Gait activity for ${dayLabel ?? 'the day'}: ${parts.join(', ') || 'no data'}`;
  }, [totals, dayLabel]);

  const innerD = (R - STROKE / 2) * 2 - 6;

  return (
    <View style={[styles.card, style]}>
      {/* ── Header (mirrors VitalsChartCard) ── */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardHeaderMetric}>Gait Activity</Text>
        {!!dayLabel && <Text style={styles.cardHeaderLabel}>{dayLabel}</Text>}
      </View>

      <View style={styles.ringWrap}>
        <Svg
          width={size}
          height={size}
          accessibilityRole="image"
          accessibilityLabel={a11yLabel}
        >
          <G>{arcs}</G>
          {dots}
          {ticks}
          {nowMarker}
        </Svg>
        <Pressable
          onPress={reset}
          style={[styles.centerOverlay, { width: innerD, height: innerD, left: cx - innerD / 2, top: cy - innerD / 2 }]}
        >
          {center}
        </Pressable>
      </View>

      {/* Per-state breakdown (tap a row to highlight that state on the ring) */}
      <View style={styles.breakdown}>
        {GAIT_ORDER.map((s) => {
          const meta = GAIT_CONFIG[s];
          const pct = DAY_SECONDS > 0 ? (totals[s] / DAY_SECONDS) * 100 : 0;
          const active = activeState === s;
          return (
            <Pressable
              key={s}
              onPress={() => toggleState(s)}
              style={[styles.row, active && styles.rowActive]}
            >
              <View style={[styles.dot, { backgroundColor: meta.color }]} />
              <Text style={[styles.rowLabel, active && styles.rowLabelActive]} numberOfLines={1}>
                {meta.label}
              </Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, pct)}%`, backgroundColor: meta.color }]} />
              </View>
              <Text style={styles.rowDuration}>{formatDuration(totals[s])}</Text>
            </Pressable>
          );
        })}
      </View>

      {onPressDetails && (
        <Pressable onPress={onPressDetails} style={styles.detailsLink} accessibilityRole="button">
          <Text style={styles.detailsText}>View activity details</Text>
        </Pressable>
      )}
    </View>
  );
};

export default GaitActivityRing;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: 20,
    alignItems: 'center',
    ...Shadows.card,
  },
  cardHeader: {
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  cardHeaderMetric: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand,
    marginBottom: 2,
  },
  cardHeaderLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9AABB8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  centerBig: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary, lineHeight: 34 },
  centerTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  centerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  centerDay: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },

  dot: { width: 10, height: 10, borderRadius: 5 },

  breakdown: { alignSelf: 'stretch', marginTop: 18, gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: Radius.sm,
  },
  rowActive: { backgroundColor: Colors.brandSurface },
  rowLabelActive: { fontWeight: '700' },
  rowLabel: { width: 96, fontSize: 13, color: Colors.textPrimary },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.screenBg,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  rowDuration: { width: 56, textAlign: 'right', fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  detailsLink: { marginTop: 16, paddingVertical: Spacing.sm },
  detailsText: { fontSize: 13, color: Colors.brand, fontWeight: '600' },
});
