export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        {/* Outer ring */}
        <div
          className="w-12 h-12 rounded-full border-2 border-[#252833] border-t-[#5eead4] animate-spin"
          style={{ animationDuration: "0.8s" }}
        />
        {/* Inner dot */}
        <div
          className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full bg-[#5eead4]"
          style={{ boxShadow: "0 0 8px rgba(94,234,212,0.4)" }}
        />
      </div>
      <p
        className="font-mono text-[10px] uppercase tracking-[3px] text-[#52525b] animate-pulse"
      >
        Cargando
      </p>
    </div>
  );
}
