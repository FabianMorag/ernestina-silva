CREATE TABLE "StageGroup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  CONSTRAINT "StageGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StageGroup_stageId_name_key" ON "StageGroup"("stageId", "name");

ALTER TABLE "StageGroup" ADD CONSTRAINT "StageGroup_stageId_fkey"
  FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Match" ADD COLUMN "groupId" TEXT;
CREATE INDEX "Match_groupId_idx" ON "Match"("groupId");
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "StageGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
