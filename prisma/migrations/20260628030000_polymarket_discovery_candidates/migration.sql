CREATE TABLE "PolymarketDiscoveryCandidate" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'polymarket',
    "externalSlug" TEXT,
    "externalMarketId" TEXT,
    "conditionId" TEXT,
    "title" TEXT NOT NULL,
    "question" TEXT,
    "eventTitle" TEXT,
    "marketType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'discovered',
    "confidence" TEXT,
    "reasonCodes" JSONB NOT NULL,
    "outcomes" JSONB NOT NULL,
    "tokenIds" JSONB NOT NULL,
    "rawMetadata" JSONB NOT NULL,
    "batchId" TEXT NOT NULL,
    "importedEventId" TEXT,
    "importedMarketId" TEXT,
    "importedOutcomeIds" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolymarketDiscoveryCandidate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PolymarketDiscoveryCandidate_source_externalMarketId_key" ON "PolymarketDiscoveryCandidate"("source", "externalMarketId");
CREATE UNIQUE INDEX "PolymarketDiscoveryCandidate_source_conditionId_key" ON "PolymarketDiscoveryCandidate"("source", "conditionId");
CREATE UNIQUE INDEX "PolymarketDiscoveryCandidate_source_externalSlug_key" ON "PolymarketDiscoveryCandidate"("source", "externalSlug");
CREATE INDEX "PolymarketDiscoveryCandidate_status_lastSeenAt_idx" ON "PolymarketDiscoveryCandidate"("status", "lastSeenAt");
CREATE INDEX "PolymarketDiscoveryCandidate_source_status_idx" ON "PolymarketDiscoveryCandidate"("source", "status");
CREATE INDEX "PolymarketDiscoveryCandidate_batchId_idx" ON "PolymarketDiscoveryCandidate"("batchId");
CREATE INDEX "PolymarketDiscoveryCandidate_importedMarketId_idx" ON "PolymarketDiscoveryCandidate"("importedMarketId");
