-- CreateTable
CREATE TABLE "walk_through_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "filesize" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "noteId" TEXT NOT NULL,
    CONSTRAINT "walk_through_photos_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "walk_through_notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
