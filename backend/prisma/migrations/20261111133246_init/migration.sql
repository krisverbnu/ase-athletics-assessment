-- CreateEnum
CREATE TYPE "Position" AS ENUM ('Goalkeeper', 'Defender', 'Midfielder', 'Forward');

-- CreateEnum
CREATE TYPE "Recommendation" AS ENUM ('SIGN', 'MONITOR', 'PASS');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "sourceId" TEXT,
    "name" TEXT NOT NULL,
    "position" "Position" NOT NULL,
    "detailedPosition" TEXT,
    "age" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "league" TEXT,
    "nationality" TEXT NOT NULL,
    "height" INTEGER,
    "weight" INTEGER,
    "preferredFoot" TEXT,
    "jerseyNumber" INTEGER,
    "imageUrl" TEXT,
    "appearances" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "minutesPlayed" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "passAccuracy" DOUBLE PRECISION,
    "shotsOnTarget" INTEGER,
    "totalShots" INTEGER,
    "dribblesCompleted" INTEGER,
    "tacklesWon" INTEGER,
    "aerialDuelsWon" INTEGER,
    "saves" INTEGER,
    "cleanSheets" INTEGER,
    "goalsConceded" INTEGER,
    "contractSalary" INTEGER,
    "contractEnd" DATE,
    "marketValue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_attributes" (
    "playerId" INTEGER NOT NULL,
    "pace" INTEGER NOT NULL,
    "shooting" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "dribbling" INTEGER NOT NULL,
    "defending" INTEGER NOT NULL,
    "physical" INTEGER NOT NULL,
    "positioning" INTEGER,
    "finishing" INTEGER,
    "crossing" INTEGER,
    "longShots" INTEGER,
    "diving" INTEGER,
    "handling" INTEGER,
    "kicking" INTEGER,
    "reflexes" INTEGER,

    CONSTRAINT "player_attributes_pkey" PRIMARY KEY ("playerId")
);

-- CreateTable
CREATE TABLE "market_value_history" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "value" INTEGER NOT NULL,
    "source" TEXT,

    CONSTRAINT "market_value_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_monthly_form" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "month" DATE NOT NULL,
    "appearances" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "averageRating" DOUBLE PRECISION,

    CONSTRAINT "player_monthly_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scout_reports" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "scoutId" INTEGER NOT NULL,
    "matchDate" DATE NOT NULL,
    "opponent" TEXT NOT NULL,
    "competition" TEXT,
    "venue" TEXT,
    "result" TEXT,
    "minutesPlayed" INTEGER,
    "positionPlayed" TEXT,
    "technical" INTEGER NOT NULL,
    "physical" INTEGER NOT NULL,
    "mental" INTEGER NOT NULL,
    "tactical" INTEGER NOT NULL,
    "finishing" INTEGER NOT NULL,
    "passing" INTEGER NOT NULL,
    "dribbling" INTEGER NOT NULL,
    "defending" INTEGER NOT NULL,
    "leadership" INTEGER NOT NULL,
    "workRate" INTEGER NOT NULL,
    "overallRating" INTEGER NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "keyMoments" TEXT[],
    "recommendation" "Recommendation" NOT NULL,
    "summary" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scout_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "players_sourceId_key" ON "players"("sourceId");

-- CreateIndex
CREATE INDEX "players_name_idx" ON "players"("name");

-- CreateIndex
CREATE INDEX "players_team_idx" ON "players"("team");

-- CreateIndex
CREATE INDEX "players_nationality_idx" ON "players"("nationality");

-- CreateIndex
CREATE INDEX "players_position_idx" ON "players"("position");

-- CreateIndex
CREATE UNIQUE INDEX "market_value_history_playerId_date_key" ON "market_value_history"("playerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "player_monthly_form_playerId_month_key" ON "player_monthly_form"("playerId", "month");

-- CreateIndex
CREATE INDEX "scout_reports_playerId_idx" ON "scout_reports"("playerId");

-- CreateIndex
CREATE INDEX "scout_reports_scoutId_idx" ON "scout_reports"("scoutId");

-- AddForeignKey
ALTER TABLE "player_attributes" ADD CONSTRAINT "player_attributes_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_value_history" ADD CONSTRAINT "market_value_history_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_monthly_form" ADD CONSTRAINT "player_monthly_form_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_reports" ADD CONSTRAINT "scout_reports_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scout_reports" ADD CONSTRAINT "scout_reports_scoutId_fkey" FOREIGN KEY ("scoutId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
