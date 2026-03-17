-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'TP', 'SL', 'BE', 'PARTIAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "auth_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "broker" TEXT,
    "initial_capital" DOUBLE PRECISION NOT NULL,
    "current_capital" DOUBLE PRECISION NOT NULL,
    "target_capital" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "entry" DOUBLE PRECISION,
    "stop_loss" DOUBLE PRECISION,
    "size" DOUBLE PRECISION,
    "risk_usd" DOUBLE PRECISION NOT NULL,
    "risk_pct" DOUBLE PRECISION NOT NULL,
    "external_id" TEXT,
    "notes" TEXT,
    "image_url" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "trade_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "PositionStatus" NOT NULL DEFAULT 'OPEN',
    "pnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closed_at" TIMESTAMP(3),
    "is_partial" BOOLEAN NOT NULL DEFAULT false,
    "partial_pct" DOUBLE PRECISION,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
