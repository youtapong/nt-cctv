import postgres from "postgres";

// Use the DATABASE_URL environment variable from .env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in the environment variables.");
}

export const sql = postgres(connectionString);

export default sql;
