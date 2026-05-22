-- Clean existing data
DELETE FROM "BonusPrediction";
DELETE FROM "Prediction";
DELETE FROM "Match";
DELETE FROM "Team";
DELETE FROM "BonusQuestion";

-- Reset sequences
ALTER SEQUENCE "Team_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Match_id_seq" RESTART WITH 1;
ALTER SEQUENCE "BonusQuestion_id_seq" RESTART WITH 1;
