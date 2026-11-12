import type { PublicFactoryWorld } from "@despega/simulator";
import {
  FACTORY_AFFINITY_LABELS,
  FACTORY_SKILL_LABELS,
} from "@despega/simulator/factory-world";
export function FactoryResults({
  world,
  skillsOnly = false,
}: {
  world: Pick<PublicFactoryWorld, "affinity" | "skills" | "climate">;
  skillsOnly?: boolean;
}) {
  return (
    <div className="factory-results">
      {!skillsOnly && (
        <>
          <p className="factory-help">
            Cómo te desenvolviste en esta experiencia. Un eje describe una
            oportunidad para explorar.
          </p>
          {(
            [
              "numeric",
              "analytical",
              "communication",
              "detail",
              "pressure",
            ] as const
          ).map((axis) => (
            <div className="factory-result" key={axis}>
              <div>
                <span>{FACTORY_AFFINITY_LABELS[axis]}</span>
                <strong>{world.affinity.normalized[axis] ?? 0}/100</strong>
              </div>
              <meter
                min={0}
                max={100}
                value={world.affinity.normalized[axis] ?? 0}
                aria-label={FACTORY_AFFINITY_LABELS[axis]}
              />
            </div>
          ))}
          <div className="factory-bipolar">
            <div>
              <span>Creativo</span>
              <strong>
                {world.affinity.raw.structure > 0 ? "+" : ""}
                {world.affinity.raw.structure}
              </strong>
              <span>Estructurado</span>
            </div>
            <div className="factory-bipolar-track">
              <i
                style={{
                  left: `${((world.affinity.raw.structure + 11) / 22) * 100}%`,
                }}
              />
            </div>
          </div>
        </>
      )}
      <h3>Tu trabajo en la experiencia</h3>
      {(["soft", "technical", "tools"] as const).map((skill) => (
        <div className="factory-result" key={skill}>
          <div>
            <span>{FACTORY_SKILL_LABELS[skill]}</span>
            <strong>
              {world.skills[skill] === null
                ? "Sin datos aún"
                : `${world.skills[skill]}%`}
            </strong>
          </div>
          <meter
            min={0}
            max={100}
            value={world.skills[skill] ?? 0}
            aria-label={FACTORY_SKILL_LABELS[skill]}
          />
        </div>
      ))}
    </div>
  );
}
