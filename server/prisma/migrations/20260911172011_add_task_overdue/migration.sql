-- AlterEnum
ALTER TYPE "ActivityType" ADD VALUE 'TASK_OVERDUE';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isOverdue" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Task_isOverdue_idx" ON "Task"("isOverdue");
