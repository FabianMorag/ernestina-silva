CREATE TYPE "ChampionshipType" AS ENUM ('COPA_AMERICA', 'WORLD_CUP');

ALTER TABLE "Championship" ADD COLUMN "type" "ChampionshipType";

UPDATE "Championship"
SET "type" = 'COPA_AMERICA'
WHERE "name" ~* '^Copa Am(é|e)rica( |$)';

UPDATE "Championship"
SET "type" = 'WORLD_CUP'
WHERE "name" ~* '^Mundial( |$)';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Championship" WHERE "type" IS NULL) THEN
    RAISE EXCEPTION 'Cannot classify every existing championship; assign its type before migrating';
  END IF;
END $$;

ALTER TABLE "Championship" ALTER COLUMN "type" SET NOT NULL;
