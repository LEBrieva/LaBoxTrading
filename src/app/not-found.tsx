import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08090c] flex items-center justify-center">
      <div className="text-center space-y-4">
        <span className="block font-mono text-6xl font-bold text-[#252833]">404</span>
        <h2 className="text-lg font-bold text-[#d4d4d8] tracking-wide">
          Página no encontrada
        </h2>
        <p className="text-[13px] text-[#52525b] font-mono">
          La ruta que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-[#5eead4] text-[#08090c] text-[13px] font-bold hover:brightness-110 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
