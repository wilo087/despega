import type { AffinityVector, FactoryState } from "@despega/simulator";
import {
  FACTORY_AFFINITY_LABELS,
  FACTORY_SKILL_LABELS,
} from "@despega/simulator/factory-world";
export function IndustrialProfile({
  values,
  factory,
}: {
  values: AffinityVector;
  factory?: FactoryState;
}) {
  return (
    <div className="grid gap-4">
      {(
        [
          "numeric",
          "analytical",
          "communication",
          "detail",
          "pressure",
        ] as const
      ).map((axis) => (
        <div className="grid gap-1.5" key={axis}>
          <div className="flex justify-between gap-3 text-sm">
            <span>{FACTORY_AFFINITY_LABELS[axis]}</span>
            <strong>{values[axis] ?? 0}/100</strong>
          </div>
          <meter
            className="h-2 w-full accent-accent"
            min={0}
            max={100}
            value={values[axis] ?? 0}
            aria-label={FACTORY_AFFINITY_LABELS[axis]}
          />
        </div>
      ))}
      <div className="grid gap-2">
        <div className="flex justify-between text-sm">
          <span>Creativo</span>
          <strong>
            {values.structure > 0 ? "+" : ""}
            {values.structure} / ±11
          </strong>
          <span>Estructurado</span>
        </div>
        <div
          className="relative h-2 rounded-full bg-surface-secondary"
          role="img"
          aria-label={`Preferencia entre creativo y estructurado: ${values.structure}, en una escala de menos once a más once`}
        >
          <span className="absolute left-1/2 h-2 border-l border-line" />
          <i
            className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-accent"
            style={{ left: `${((values.structure + 11) / 22) * 100}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-ink">
        NUM y el eje bipolar de Industrial no se comparan con datos históricos
        de Software que no midieron esas dimensiones.
      </p>
      {factory && (
        <>
          <h3 className="mt-2 font-bold">Trabajo en la experiencia</h3>
          {(["soft", "technical", "tools"] as const).map((skill) => {
            const s = factory.skills[skill];
            const value = s.possible
              ? Math.round((s.earned / s.possible) * 100)
              : null;
            return (
              <div key={skill} className="flex justify-between text-sm">
                <span>{FACTORY_SKILL_LABELS[skill]}</span>
                <strong>{value === null ? "Sin datos" : `${value}%`}</strong>
              </div>
            );
          })}
          <p className="text-sm">
            Objetivos: {factory.objectives.length} · Cajas buenas:{" "}
            {Math.floor(factory.production.good).toLocaleString("es-DO")} ·
            Despacho:{" "}
            {factory.production.dispatched?.toLocaleString("es-DO") ??
              "Pendiente"}
          </p>
        </>
      )}
    </div>
  );
}

export function IndustrialRadar({ values }: { values: AffinityVector }) {
  const axes = [
    "numeric",
    "analytical",
    "communication",
    "detail",
    "pressure",
  ] as const;
  const point = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [220 + Math.cos(a) * 104 * r, 172 + Math.sin(a) * 104 * r];
  };
  return (
    <svg
      viewBox="0 0 440 330"
      className="mx-auto h-auto w-full max-w-md"
      role="img"
      aria-label="Perfil Industrial de cinco dimensiones unipolares. EST se muestra separado."
    >
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={axes.map((_, i) => point(i, r).join(",")).join(" ")}
          className="fill-none stroke-line"
        />
      ))}
      <polygon
        points={axes
          .map((axis, i) =>
            point(i, Math.max(0, Math.min(1, (values[axis] ?? 0) / 100))).join(
              ",",
            ),
          )
          .join(" ")}
        className="fill-accent stroke-accent"
        fillOpacity={0.12}
        strokeWidth={2}
      />
      {axes.map((axis, i) => {
        const [x, y] = point(i, 1.28);
        return (
          <text
            key={axis}
            x={x}
            y={y}
            textAnchor={
              Math.abs(x! - 220) < 8 ? "middle" : x! > 220 ? "start" : "end"
            }
            className="fill-ink"
            fontSize={11}
          >
            <tspan x={x} fontWeight={700}>
              {axis === "numeric"
                ? "Números"
                : axis === "analytical"
                  ? "Problemas"
                  : axis === "communication"
                    ? "Comunicación"
                    : axis === "detail"
                      ? "Detalle"
                      : "Presión"}
            </tspan>
            <tspan x={x} dy={16}>
              {values[axis] ?? 0}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
