-- CreateTable or AlterTable for sbn_number field
-- This migration adds the sbn_number column to business_profiles table

ALTER TABLE `business_profiles` ADD COLUMN `sbn_number` VARCHAR(191) NULL;
