ALTER TABLE "Match" ADD COLUMN "knockoutRound" INTEGER;
ALTER TABLE "Match" ADD COLUMN "knockoutSlot" INTEGER;

ALTER TABLE "Match" ADD CONSTRAINT "Match_knockout_placement_check" CHECK (
  ("knockoutRound" IS NULL AND "knockoutSlot" IS NULL)
  OR (
    "stageId" IS NOT NULL
    AND "knockoutRound" IS NOT NULL
    AND "knockoutSlot" IS NOT NULL
    AND "knockoutRound" IN (2, 4, 8, 16, 32, 64)
    AND "knockoutSlot" BETWEEN 1 AND "knockoutRound" / 2
  )
);

CREATE UNIQUE INDEX "Match_stageId_knockoutRound_knockoutSlot_key"
  ON "Match"("stageId", "knockoutRound", "knockoutSlot");
