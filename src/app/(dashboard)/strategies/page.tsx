import { getStrategies } from "@/lib/actions/strategies";
import { StrategyCard } from "@/components/strategies/strategy-card";
import { StrategyFormButton } from "@/components/strategies/strategy-form-button";

export default async function StrategiesPage() {
  const strategies = await getStrategies();

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#d4d4d8] tracking-wide uppercase">
          Estrategias
        </h1>
        <StrategyFormButton />
      </div>

      {strategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <span className="text-2xl text-[#252833]">◇</span>
          <p className="text-[12px] text-[#52525b] tracking-[2px] uppercase">
            No hay estrategias creadas
          </p>
          <p className="text-[11px] text-[#3f3f46] max-w-[300px] text-center">
            Creá una estrategia con campos custom para validar tus trades
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((s) => (
            <StrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      )}
    </div>
  );
}
