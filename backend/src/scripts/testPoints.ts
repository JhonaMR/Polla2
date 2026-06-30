import { pointsService } from '../services/pointsService.js';

console.log('Result for GROUPS (1-1 predicted, 1-1 actual):', pointsService.getPointsForMatch('GROUPS', 1, 1, 1, 1));
console.log('Result for GROUPS (2-2 predicted, 1-1 actual):', pointsService.getPointsForMatch('GROUPS', 2, 2, 1, 1));
console.log('Result for ROUND_OF_32 (2-2 predicted, 1-1 actual):', pointsService.getPointsForMatch('ROUND_OF_32', 2, 2, 1, 1));
console.log('Result for ROUND_OF_32 (1-1 predicted, 1-1 actual):', pointsService.getPointsForMatch('ROUND_OF_32', 1, 1, 1, 1));
