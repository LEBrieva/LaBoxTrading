import { notFound } from "next/navigation";
import { getTrade } from "@/lib/actions/trades";
import { formatPnl, formatCurrency } from "@/lib/calculations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClosePositionDialog } from "@/components/trades/close-position-dialog";
import { ArrowUpRight, ArrowDownRight, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let trade;
  try {
    trade = await getTrade(id);
  } catch {
    notFound();
  }

  const totalPnl = trade.positions.reduce((sum, p) => sum + p.pnl, 0);
  const openPositions = trade.positions.filter((p) => p.status === "OPEN");
  const closedPositions = trade.positions.filter((p) => p.status !== "OPEN");
  const isLong = trade.direction === "LONG";

  // Check if first position was closed as TP (suggest BE for rest)
  const firstClosed = trade.positions[0]?.status;
  const suggestBE = firstClosed === "TP" && openPositions.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3 md:gap-4">
        <Link href="/trades" className="p-2 rounded-lg text-[#6b7485] hover:text-[#e8eaf0] hover:bg-[#181c23] transition-colors shrink-0">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          {isLong ? (
            <ArrowUpRight className="size-5 text-green-500" />
          ) : (
            <ArrowDownRight className="size-5 text-red-500" />
          )}
          <h1 className="text-xl md:text-2xl font-bold font-mono">{trade.pair}</h1>
          <Badge variant={isLong ? "default" : "destructive"}>{trade.direction}</Badge>
          <Badge variant={trade.status === "OPEN" ? "outline" : "secondary"}>{trade.status}</Badge>
        </div>
      </div>

      {/* Trade info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Entrada</p>
              <p className="font-mono font-medium">{trade.entry?.toFixed(2) ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Stop Loss</p>
              <p className="font-mono font-medium">{trade.stopLoss?.toFixed(2) ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Riesgo</p>
              <p className="font-mono font-medium">
                {formatCurrency(trade.riskUsd)} ({trade.riskPct.toFixed(1)}%)
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Tamaño</p>
              <p className="font-mono font-medium">{trade.size ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Abierto</p>
              <p className="font-mono font-medium text-xs">
                {trade.openedAt.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {trade.closedAt && (
              <div>
                <p className="text-muted-foreground">Cerrado</p>
                <p className="font-mono font-medium text-xs">
                  {trade.closedAt.toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {trade.externalId && (
              <div>
                <p className="text-muted-foreground">ID Broker</p>
                <p className="font-mono font-medium text-xs">{trade.externalId}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">P&L Total</p>
              <p className={`font-mono font-bold text-lg ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatPnl(totalPnl)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggest BE */}
      {suggestBE && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-3 text-sm text-yellow-500">
            Primera posición cerrada en TP. Considerá mover las restantes a Break Even.
          </CardContent>
        </Card>
      )}

      {/* Positions */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Posiciones</h2>
        </div>

        <div className="space-y-3">
          {trade.positions.map((pos) => (
            <Card key={pos.id}>
              <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium">{pos.label}</span>
                  <Badge
                    variant={
                      pos.status === "OPEN"
                        ? "outline"
                        : pos.status === "TP"
                          ? "default"
                          : pos.status === "SL"
                            ? "destructive"
                            : "secondary"
                    }
                  >
                    {pos.status}
                  </Badge>
                  {pos.isPartial && (
                    <span className="text-xs text-muted-foreground">
                      ({pos.partialPct}% cerrado)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {pos.status !== "OPEN" && (
                    <span className={`font-mono font-bold ${pos.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatPnl(pos.pnl)}
                    </span>
                  )}
                  {pos.status === "OPEN" && (
                    <ClosePositionDialog
                      positionId={pos.id}
                      positionLabel={pos.label}
                      riskUsd={trade.riskUsd}
                      trade={trade}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Notes */}
      {trade.notes && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-2">Notas</h2>
            <Card>
              <CardContent className="py-4">
                <p className="text-sm whitespace-pre-wrap">{trade.notes}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Image */}
      {trade.imageUrl && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Screenshot</h2>
          <Card>
            <CardContent className="py-4">
              <img
                src={trade.imageUrl}
                alt="Trade screenshot"
                className="rounded-md max-w-full h-auto"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
