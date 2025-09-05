-- AlterTable
ALTER TABLE "public"."ConcertLog" ADD COLUMN     "concertId" TEXT;

-- CreateTable
CREATE TABLE "public"."Artist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Concert" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Artist_name_idx" ON "public"."Artist"("name");

-- CreateIndex
CREATE INDEX "Venue_name_idx" ON "public"."Venue"("name");

-- CreateIndex
CREATE INDEX "Venue_city_idx" ON "public"."Venue"("city");

-- CreateIndex
CREATE INDEX "Concert_artistId_idx" ON "public"."Concert"("artistId");

-- CreateIndex
CREATE INDEX "Concert_venueId_idx" ON "public"."Concert"("venueId");

-- CreateIndex
CREATE INDEX "Concert_date_idx" ON "public"."Concert"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Concert_artistId_venueId_date_key" ON "public"."Concert"("artistId", "venueId", "date");

-- CreateIndex
CREATE INDEX "ConcertLog_concertId_idx" ON "public"."ConcertLog"("concertId");

-- AddForeignKey
ALTER TABLE "public"."ConcertLog" ADD CONSTRAINT "ConcertLog_concertId_fkey" FOREIGN KEY ("concertId") REFERENCES "public"."Concert"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Concert" ADD CONSTRAINT "Concert_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "public"."Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Concert" ADD CONSTRAINT "Concert_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
