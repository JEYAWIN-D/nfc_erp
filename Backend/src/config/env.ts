import { z } from "zod";
import dotenv from "dotenv";

// Ensure .env is loaded before validation
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PORT: z.string().optional().default("5000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  parsed.error.issues.forEach((e: z.ZodIssue) => {
    console.error(`  - ${e.path.join(".")}: ${e.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
