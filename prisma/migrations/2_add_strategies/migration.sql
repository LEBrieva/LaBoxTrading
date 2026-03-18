-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_checklists" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "strategy_id" TEXT,
    "values" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "strategies_user_id_idx" ON "strategies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_checklists_trade_id_key" ON "trade_checklists"("trade_id");

-- CreateIndex
CREATE INDEX "trade_checklists_strategy_id_idx" ON "trade_checklists"("strategy_id");

-- AddForeignKey
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_checklists" ADD CONSTRAINT "trade_checklists_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_checklists" ADD CONSTRAINT "trade_checklists_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "strategies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
