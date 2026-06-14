-- CreateTable
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "telegramChatId" TEXT,
    "linkToken" TEXT,
    "linkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "telegramChatId" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "linkToken" TEXT,
    "linkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Student_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recurrence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "timeOfDay" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "subject" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recurrence_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recurrence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tutorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "subject" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "recurrenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lesson_recurrenceId_fkey" FOREIGN KEY ("recurrenceId") REFERENCES "Recurrence" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "remindAt" DATETIME NOT NULL,
    "offsetLabel" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reminder_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_email_key" ON "Tutor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_linkToken_key" ON "Tutor"("linkToken");

-- CreateIndex
CREATE UNIQUE INDEX "Student_linkToken_key" ON "Student"("linkToken");

-- CreateIndex
CREATE INDEX "Student_tutorId_idx" ON "Student"("tutorId");

-- CreateIndex
CREATE INDEX "Recurrence_tutorId_idx" ON "Recurrence"("tutorId");

-- CreateIndex
CREATE INDEX "Lesson_tutorId_startAt_idx" ON "Lesson"("tutorId", "startAt");

-- CreateIndex
CREATE INDEX "Lesson_startAt_idx" ON "Lesson"("startAt");

-- CreateIndex
CREATE INDEX "Reminder_status_remindAt_idx" ON "Reminder"("status", "remindAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reminder_lessonId_recipient_remindAt_key" ON "Reminder"("lessonId", "recipient", "remindAt");
