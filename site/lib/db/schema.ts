import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const pairingRequests = pgTable("skylar_pairing_requests", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("pending"),
  pairingCode: text("pairing_code"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }),
});
