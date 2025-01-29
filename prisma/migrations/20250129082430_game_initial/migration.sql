/*
  Warnings:

  - You are about to drop the column `score` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "player2_id" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'waiting';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "score";

-- CreateTable
CREATE TABLE "GameState" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "board" TEXT NOT NULL,
    "turn" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "winner" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameState_room_id_key" ON "GameState"("room_id");
