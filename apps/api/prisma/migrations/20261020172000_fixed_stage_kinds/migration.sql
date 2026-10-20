-- Merge legacy stages of the same kind without losing match assignments.
WITH canonical AS (
  SELECT "id", MIN("id") OVER (PARTITION BY "championshipId", "kind") AS "canonicalId"
  FROM "Stage"
)
UPDATE "Match" AS m
SET "stageId" = canonical."canonicalId"
FROM canonical
WHERE m."stageId" = canonical."id"
  AND canonical."id" <> canonical."canonicalId";

WITH canonical AS (
  SELECT "id", MIN("id") OVER (PARTITION BY "championshipId", "kind") AS "canonicalId"
  FROM "Stage"
)
DELETE FROM "Stage" AS stage
USING canonical
WHERE stage."id" = canonical."id"
  AND canonical."id" <> canonical."canonicalId";

DROP INDEX "Stage_championshipId_name_key";
ALTER TABLE "Stage" DROP COLUMN "name";
CREATE UNIQUE INDEX "Stage_championshipId_kind_key" ON "Stage"("championshipId", "kind");
