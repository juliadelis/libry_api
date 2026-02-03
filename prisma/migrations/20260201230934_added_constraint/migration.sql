/*
  Warnings:

  - A unique constraint covering the columns `[userId,bookId]` on the table `ShelfItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShelfItem_userId_bookId_key" ON "ShelfItem"("userId", "bookId");
