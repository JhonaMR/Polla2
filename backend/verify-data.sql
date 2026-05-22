SELECT 'Teams' as entity, COUNT(*) as count FROM "Team"
UNION ALL
SELECT 'Matches', COUNT(*) FROM "Match"
UNION ALL
SELECT 'Bonus Questions', COUNT(*) FROM "BonusQuestion"
UNION ALL
SELECT 'Matches by Phase - GROUPS', COUNT(*) FROM "Match" WHERE "phase" = 'GROUPS'
UNION ALL
SELECT 'Matches by Phase - ROUND_OF_16', COUNT(*) FROM "Match" WHERE "phase" = 'ROUND_OF_16'
UNION ALL
SELECT 'Matches by Phase - QUARTERFINALS', COUNT(*) FROM "Match" WHERE "phase" = 'QUARTERFINALS'
UNION ALL
SELECT 'Matches by Phase - SEMIFINALS', COUNT(*) FROM "Match" WHERE "phase" = 'SEMIFINALS'
UNION ALL
SELECT 'Matches by Phase - FINAL', COUNT(*) FROM "Match" WHERE "phase" = 'FINAL';
