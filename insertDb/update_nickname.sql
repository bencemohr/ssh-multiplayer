-- Drop the global UNIQUE constraint on nickName (with correct case)
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_nickName_key";

-- Show current constraints to verify
SELECT conname FROM pg_constraint WHERE conrelid = '"user"'::regclass;
