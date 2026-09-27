import "dotenv/config";
import { desc, like } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { tickets } from "./schema.js";

const dbUser = process.env.POSTGRES_APP_USER;
const dbPassword = process.env.POSTGRES_APP_PASSWORD;
const dbHost = process.env.POSTGRES_HOST;
const dbPort = process.env.POSTGRES_PORT;
const dbName = process.env.POSTGRES_DB;

if (
  !process.env.DATABASE_URL &&
  (!dbUser || !dbPassword || !dbHost || !dbName || !dbPort)
) {
  throw new Error("Invalid DB env.");
}

export const connectionString: string =
  process.env.DATABASE_URL ||
  `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;


export async function generateTicketNumber(
  db?: PostgresJsDatabase<any>,
  year: number = new Date().getFullYear()
): Promise<string> {
  const targetDb = db ?? (await import("./client.js")).dbClient;
  const prefix = `FAC-${year}-`;

  const existingTickets = await targetDb
    .select({ ticketNumber: tickets.ticketNumber })
    .from(tickets)
    .where(like(tickets.ticketNumber, `${prefix}%`))
    .orderBy(desc(tickets.ticketNumber));

  let maxSequence = 0;
  for (const t of existingTickets) {
    if (t.ticketNumber) {
      const parts = t.ticketNumber.split("-");
      if (parts.length >= 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSequence) {
          maxSequence = seq;
        }
      }
    }
  }

  const nextSequence = maxSequence + 1;
  const paddedSequence = String(nextSequence).padStart(4, "0");
  return `${prefix}${paddedSequence}`;
}
