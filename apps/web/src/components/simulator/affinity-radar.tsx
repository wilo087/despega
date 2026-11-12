import { FACTORY_AFFINITY_LABELS } from '@despega/simulator/factory-world';
import { AFFINITY_AXES, AFFINITY_LABELS, AFFINITY_SHORT_LABELS, type AffinityAxis, type AffinityVector } from '@despega/simulator/public';

/**
 * Radar de afinidad (5 ejes, serie única). Sigue la guía de visualización del
 * proyecto: trazo de 2 px, relleno al ~12 %, marcadores con anillo del color de la
 * superficie, grilla sólida y tenue, y textos en tokens de tinta. Su gemelo
 * accesible es `AffinityBars`.
 */
/** Color de la serie como clases de Tailwind: sale del token `accent`, no de un hex. */
export const RADAR_SERIES_CLASS = 'fill-accent stroke-accent';
/** Lienzo más ancho que alto: deja espacio a las etiquetas laterales sin recortarlas. */
export const RADAR_VIEW = { width: 440, height: 330, center: { x: 220, y: 172 }, radius: 104 } as const;

type Point = { readonly x: number; readonly y: number };

export function radarPoint(index: number, ratio: number, center: Point, radius: number): [number, number] {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / AFFINITY_AXES.length;
  return [center.x + Math.cos(angle) * radius * ratio, center.y + Math.sin(angle) * radius * ratio];
}

export function radarPolygon(values: AffinityVector, center: Point, radius: number): string {
  return AFFINITY_AXES.map((axis, index) => radarPoint(index, clampRatio(values[axis]), center, radius).join(',')).join(' ');
}

export function AffinityRadar({
  values,
  size = 320,
  className = '',
  unavailable = [],
}: {
  values: AffinityVector;
  size?: number;
  className?: string;
  /** Ejes sin oportunidades todavía (p. ej. estructura tras la sesión 1). */
  unavailable?: readonly AffinityAxis[];
}) {
  if (values.numeric !== undefined) {
    const axes=['numeric','analytical','communication','detail','pressure'] as const;
    return <svg viewBox="0 0 440 330" width={size} className={`h-auto max-w-full ${className}`} role="img" aria-label="Perfil Industrial: cinco dimensiones unipolares. La preferencia creativa o estructurada se muestra aparte."><RadarGrid center={RADAR_VIEW.center} radius={RADAR_VIEW.radius}/><polygon points={axes.map((axis,i)=>radarPoint(i,clampRatio(values[axis]??0),RADAR_VIEW.center,RADAR_VIEW.radius).join(',')).join(' ')} className="fill-accent stroke-accent" fillOpacity={.12} strokeWidth={2}/>{axes.map((axis,i)=>{const [x,y]=radarPoint(i,1.28,RADAR_VIEW.center,RADAR_VIEW.radius);return <text key={axis} x={x} y={y} textAnchor={Math.abs(x-220)<8?'middle':x>220?'start':'end'} className="fill-ink" fontSize={12}><tspan x={x} fontWeight={700}>{axis==='analytical'?'Problemas':AFFINITY_SHORT_LABELS[axis]}</tspan><tspan x={x} dy={16}>{values[axis]??0}</tspan></text>;})}</svg>;
  }
  const description = AFFINITY_AXES.map((axis) => `${AFFINITY_LABELS[axis]}: ${unavailable.includes(axis) ? 'sin datos aún' : `${values[axis]} de 100`}`).join('; ');

  return (
    <svg viewBox={`0 0 ${RADAR_VIEW.width} ${RADAR_VIEW.height}`} width={size} height={(size * RADAR_VIEW.height) / RADAR_VIEW.width} className={`h-auto max-w-full ${className}`} role="img" aria-label={`Perfil de afinidad. ${description}.`}>
      <RadarGrid center={RADAR_VIEW.center} radius={RADAR_VIEW.radius} />
      <polygon points={radarPolygon(values, RADAR_VIEW.center, RADAR_VIEW.radius)} className={RADAR_SERIES_CLASS} fillOpacity={0.12} strokeWidth={2} strokeLinejoin="round" />
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = radarPoint(index, clampRatio(values[axis]), RADAR_VIEW.center, RADAR_VIEW.radius);
        return <circle key={axis} cx={x} cy={y} r={4.5} className="fill-accent" stroke="#fff" strokeWidth={2} />;
      })}
      <RadarLabels values={values} center={RADAR_VIEW.center} radius={RADAR_VIEW.radius} unavailable={unavailable} />
    </svg>
  );
}

export function RadarGrid({ center, radius }: { center: Point; radius: number }) {
  return (
    <g aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={AFFINITY_AXES.map((_, index) => radarPoint(index, ring, center, radius).join(',')).join(' ')}
          fill="none"
          className="stroke-line"
          strokeWidth={1}
        />
      ))}
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = radarPoint(index, 1, center, radius);
        return <line key={axis} x1={center.x} y1={center.y} x2={x} y2={y} className="stroke-line" strokeWidth={1} />;
      })}
    </g>
  );
}

export function RadarLabels({
  values,
  center,
  radius,
  unavailable = [],
}: {
  values: AffinityVector;
  center: Point;
  radius: number;
  unavailable?: readonly AffinityAxis[];
}) {
  return (
    <g aria-hidden="true">
      {AFFINITY_AXES.map((axis, index) => {
        const [x, y] = radarPoint(index, 1.24, center, radius);
        const anchor = Math.abs(x - center.x) < 8 ? 'middle' : x > center.x ? 'start' : 'end';
        return (
          <text key={axis} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="font-sans">
            <tspan x={x} dy="-0.45em" fontSize="13" fontWeight="700" className="fill-ink">{AFFINITY_SHORT_LABELS[axis]}</tspan>
            <tspan x={x} dy="1.25em" fontSize="12" className="fill-muted">{unavailable.includes(axis) ? '—' : values[axis]}</tspan>
          </text>
        );
      })}
    </g>
  );
}

/** Gemelo accesible del radar: una barra por eje con su valor visible. */
export function AffinityBars({
  values,
  unavailable = [],
  deltas,
  compact = false,
}: {
  values: AffinityVector;
  unavailable?: readonly AffinityAxis[];
  deltas?: Partial<Record<AffinityAxis, number>>;
  /** Etiquetas cortas para paneles angostos. */
  compact?: boolean;
}) {
  if (values.numeric !== undefined) return <div className="grid gap-4">{(['numeric','analytical','communication','detail','pressure'] as const).map(axis=><div key={axis}><div className="flex justify-between text-sm"><span>{FACTORY_AFFINITY_LABELS[axis]}</span><strong>{values[axis]??0}/100</strong></div><meter className="h-2 w-full accent-good" min={0} max={100} value={values[axis]??0} aria-label={FACTORY_AFFINITY_LABELS[axis]}/></div>)}<div className="flex justify-between text-sm"><span>Creativo</span><strong>{values.structure>0?'+':''}{values.structure} / ±11</strong><span>Estructurado</span></div><div className="relative h-2 rounded-full bg-mist" role="img" aria-label={`Preferencia entre creativo y estructurado: ${values.structure}, en una escala de menos once a más once`}><span className="absolute left-1/2 h-2 border-l border-line-strong"/><i className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-accent" style={{left:`${(values.structure+11)/22*100}%`}}/></div></div>;
  return (
    <ul className={`grid ${compact ? 'gap-2.5' : 'gap-3'}`}>
      {AFFINITY_AXES.map((axis) => {
        const missing = unavailable.includes(axis);
        const delta = deltas?.[axis];
        return (
          <li key={axis}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold text-ink">{compact ? AFFINITY_SHORT_LABELS[axis] : AFFINITY_LABELS[axis]}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums text-muted">
                {missing ? 'Sin datos aún' : `${values[axis]} / 100`}
                {delta ? <span className="ml-2 font-semibold text-ink">{delta > 0 ? `+${delta}` : delta} pts</span> : null}
              </span>
            </div>
            <div className={`overflow-hidden rounded-full bg-accent-soft ${compact ? 'mt-1 h-1.5' : 'mt-1.5 h-2'}`} aria-hidden="true">
              <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${missing ? 0 : values[axis]}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value / 100));
}
