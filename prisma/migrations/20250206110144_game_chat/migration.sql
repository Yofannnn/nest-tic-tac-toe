-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "password" TEXT;

-- CreateTable
CREATE TABLE "GameChat" (
    "id" SERIAL NOT NULL,
    "room_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameChat_pkey" PRIMARY KEY ("id")
);
