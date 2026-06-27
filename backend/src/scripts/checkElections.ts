import { predictionService } from '../services/predictionService.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';

async function main() {
  try {
    await connectDatabase();
    console.log("Checking match 1 elections...");
    const elections = await predictionService.getMatchPredictionsWithRunningTotal(1);
    console.log("SUCCESS! Retrieved", elections.length, "elections:");
    console.log(JSON.stringify(elections.slice(0, 3), null, 2));
  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
  } finally {
    await disconnectDatabase();
  }
}

main();
