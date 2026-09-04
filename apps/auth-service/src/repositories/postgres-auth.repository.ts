import { eq } from "drizzle-orm";

import { authUsers } from "../infra/postgres/auth.schema.js";

import { IAuthRepository } from "./auth.repository.js";
import { IAuthUser } from "../models/auth.model.js";
import { postgresDb } from "../config/postgres.db.js";

export class PostgresAuthRepository implements IAuthRepository {
  async findById(userId: string): Promise<IAuthUser | null> {
    const [user] = await postgresDb
      .select()
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);
    return user ?? null;
  }

  async findByEmail(email: string): Promise<IAuthUser | null> {
    const [user] = await postgresDb
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email))
      .limit(1);
    return user ?? null;
  }

  async emailExists(email: string): Promise<boolean> {
    const [user] = await postgresDb
      .select({
        id: authUsers.id,
      })
      .from(authUsers)
      .where(eq(authUsers.email, email))
      .limit(1);
    return user !== undefined;
  }

  async isEmailTakenByAnotherUser(
    userId: string,
    email: string,
  ): Promise<boolean> {
    const [taken] = await postgresDb
      .select({
        id: authUsers.id,
      })
      .from(authUsers)
      .where(eq(authUsers.email, email))
      .limit(1);
    return taken !== undefined && taken.id !== userId;
  }

  async create(data: {
    id: string;
    email: string;
    hashedPassword: string;
  }): Promise<IAuthUser> {
    const [user] = await postgresDb
      .insert(authUsers)
      .values({
        id: data.id,
        email: data.email,
        hashedPassword: data.hashedPassword,
      })
      .returning();

    if (!user) {
      throw new Error("Failed to create auth user");
    }

    return user;
  }

  async deleteById(userId: string): Promise<void> {
    await postgresDb.delete(authUsers).where(eq(authUsers.id, userId));
  }

  async updatePassword(
    userId: string,
    hashedPassword: string,
  ): Promise<IAuthUser | null> {
    const [user] = await postgresDb
      .update(authUsers)
      .set({ hashedPassword, updatedAt: new Date() })
      .where(eq(authUsers.id, userId))
      .returning();

    return user ?? null;
  }

  async updateEmail(userId: string, email: string): Promise<IAuthUser | null> {
    const [user] = await postgresDb
      .update(authUsers)
      .set({ email })
      .where(eq(authUsers.id, userId))
      .returning();
    return user;
  }

  async findAuthUserForPasswordCheck(
    userId: string,
  ): Promise<IAuthUser | null> {
    const [user] = await postgresDb
      .select({
        id: authUsers.id,
        email: authUsers.email,
        hashedPassword: authUsers.hashedPassword,
        createdAt: authUsers.createdAt,
        updatedAt: authUsers.updatedAt,
      })
      .from(authUsers)
      .where(eq(authUsers.id, userId))
      .limit(1);

    return user ?? null;
  }
}
