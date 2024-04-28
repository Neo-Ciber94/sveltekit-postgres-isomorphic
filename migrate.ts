import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./src/lib/db";

migrate(db, { migrationsFolder: "./static/drizzle" }).catch((err) => {
  console.error(err);
});
