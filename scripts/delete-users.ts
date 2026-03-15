/**
 * One-off script: delete specified user accounts and clean related data.
 * Run from project root: npx tsx scripts/delete-users.ts
 * Requires DATABASE_URL in .env or environment.
 */
import "dotenv/config";
import { db } from "../server/database";
import {
  users,
  recruits,
  qrSurveyResponses,
  stationCommanderRequests,
  stationChangeRequests,
} from "../shared/schema";
import { inArray } from "drizzle-orm";

const EMAILS_TO_DELETE = [
  "sc3rec3@cybitteam.testinator.email",
  "sc3rec2@cybitteam.testinator.email",
  "sc3rec1@cybitteam.testinator.email",
  "sc2rec3@cybitteam.testinator.email",
  "sc2rec2@cybitteam.testinator.email",
  "sc2rec1@cybitteam.testinator.email",
  "sc1rec3@cybitteam.testinator.email",
  "sc1rec2@cybitteam.testinator.email",
  "sc1rec1@cybitteam.testinator.email",
  "sc3@cybitteam.testinator.email",
  "sc2@cybitteam.testinator.email",
  "sc1@cybitteam.testinator.email",
  "alex.moran@snhu.edu",
  "kai.c.olson.mil@army.mil",
  "alexmoran.official3@gmail.com",
];

async function main() {
  console.log("Fetching user IDs for", EMAILS_TO_DELETE.length, "emails...");
  const toDelete = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName })
    .from(users)
    .where(inArray(users.email, EMAILS_TO_DELETE));

  if (toDelete.length === 0) {
    console.log("No matching users found. Exiting.");
    process.exit(0);
  }

  const ids = toDelete.map((u) => u.id);
  console.log("Found", toDelete.length, "users to delete:", toDelete.map((u) => u.email).join(", "));

  // 1. Unlink recruits from these recruiters (set recruiter_id = null)
  await db.update(recruits).set({ recruiterId: null }).where(inArray(recruits.recruiterId, ids));
  console.log("Recruits unlinked (recruiter_id set to null).");

  // 2. Delete survey responses by these recruiters
  await db.delete(qrSurveyResponses).where(inArray(qrSurveyResponses.recruiterId, ids));
  console.log("QR survey responses deleted.");

  // 3. Delete station commander requests where these users are the requester
  await db.delete(stationCommanderRequests).where(inArray(stationCommanderRequests.userId, ids));
  console.log("Station commander requests (as requester) deleted.");

  // 4. Null out reviewedBy in station_commander_requests where these users were the reviewer
  await db
    .update(stationCommanderRequests)
    .set({ reviewedBy: null })
    .where(inArray(stationCommanderRequests.reviewedBy, ids));
  console.log("Station commander requests (reviewedBy) cleared.");

  // 5. Null out reviewedBy in station_change_requests where these users were the reviewer
  await db
    .update(stationChangeRequests)
    .set({ reviewedBy: null })
    .where(inArray(stationChangeRequests.reviewedBy, ids));
  console.log("Station change requests (reviewedBy) cleared.");

  // 6. Delete users (qr_code_locations, qr_scans, station_change_requests by userId, notifications have onDelete cascade)
  await db.delete(users).where(inArray(users.id, ids));
  console.log("Users deleted:", toDelete.length);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
