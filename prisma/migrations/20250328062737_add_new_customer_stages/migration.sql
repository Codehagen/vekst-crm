-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "customer_stage" ADD VALUE 'offer_sent';
ALTER TYPE "customer_stage" ADD VALUE 'offer_accepted';
ALTER TYPE "customer_stage" ADD VALUE 'declined';
