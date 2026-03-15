import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const schema = z.object({
    PORT: z.coerce.number().default(5000),
    CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string().min(12),
    JWT_EXPIRES_IN: z.string().default("1d"),
    PISTON_URL: z.string().url().default("https://emkc.org/api/v2/piston/execute"),
});
export const env = schema.parse(process.env);
