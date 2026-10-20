-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "ChampionshipParticipant" (
    "id" TEXT NOT NULL,
    "championshipId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "ChampionshipParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChampionshipParticipant_teamId_idx" ON "ChampionshipParticipant"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipParticipant_championshipId_playerId_key" ON "ChampionshipParticipant"("championshipId", "playerId");

-- AddForeignKey
ALTER TABLE "ChampionshipParticipant" ADD CONSTRAINT "ChampionshipParticipant_championshipId_fkey" FOREIGN KEY ("championshipId") REFERENCES "Championship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipParticipant" ADD CONSTRAINT "ChampionshipParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipParticipant" ADD CONSTRAINT "ChampionshipParticipant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
