import {
  pgTable,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const authUsers = pgTable("auth_users", {
  id: uuid("id")
    .primaryKey()
    .defaultRandom(),

  email: text("email")
    .notNull()
    .unique(),

  hashedPassword: text("hashed_password")
    .notNull(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
