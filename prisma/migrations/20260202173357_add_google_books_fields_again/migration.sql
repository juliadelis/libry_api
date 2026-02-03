-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "googleVolumeId" TEXT,
ADD COLUMN     "infoLink" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "previewLink" TEXT,
ADD COLUMN     "publishedDate" TEXT,
ADD COLUMN     "ratingsCount" INTEGER,
ADD COLUMN     "raw" JSONB,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "subtitle" TEXT;
