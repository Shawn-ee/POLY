-- Phase 5: persisted dry-run reference market maker configuration and intents.
CREATE TABLE "BotQuoteConfig" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'polymarket',
    "edgeTicks" INTEGER NOT NULL DEFAULT 2,
    "tickSize" DECIMAL(20,8) NOT NULL DEFAULT 0.01,
    "baseOrderSize" DECIMAL(36,6) NOT NULL DEFAULT 1,
    "maxOrderSize" DECIMAL(36,6) NOT NULL DEFAULT 1,
    "maxOutcomeExposure" DECIMAL(36,6) NOT NULL DEFAULT 10,
    "maxMarketExposure" DECIMAL(36,6) NOT NULL DEFAULT 25,
    "maxDailyNotional" DECIMAL(36,6) NOT NULL DEFAULT 50,
    "staleAfterSeconds" INTEGER NOT NULL DEFAULT 15,
    "minQuoteLifetimeSeconds" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotQuoteConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BotOrderIntent" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "size" DECIMAL(36,6) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRY_RUN',
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotOrderIntent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BotQuoteConfig_enabled_source_idx" ON "BotQuoteConfig"("enabled", "source");
CREATE INDEX "BotQuoteConfig_marketId_enabled_idx" ON "BotQuoteConfig"("marketId", "enabled");
CREATE INDEX "BotQuoteConfig_outcomeId_idx" ON "BotQuoteConfig"("outcomeId");
CREATE INDEX "BotOrderIntent_marketId_createdAt_idx" ON "BotOrderIntent"("marketId", "createdAt");
CREATE INDEX "BotOrderIntent_outcomeId_createdAt_idx" ON "BotOrderIntent"("outcomeId", "createdAt");
CREATE INDEX "BotOrderIntent_status_createdAt_idx" ON "BotOrderIntent"("status", "createdAt");
CREATE INDEX "BotOrderIntent_dryRun_createdAt_idx" ON "BotOrderIntent"("dryRun", "createdAt");

ALTER TABLE "BotQuoteConfig" ADD CONSTRAINT "BotQuoteConfig_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotQuoteConfig" ADD CONSTRAINT "BotQuoteConfig_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotOrderIntent" ADD CONSTRAINT "BotOrderIntent_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotOrderIntent" ADD CONSTRAINT "BotOrderIntent_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
