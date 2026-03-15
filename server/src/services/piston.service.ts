import axios from "axios";
import { env } from "../config/env.js";

type RunParams = {
  language: string;
  source: string;
  stdin?: string;
};

export async function executeCode({ language, source, stdin = "" }: RunParams) {
  const payload = {
    language,
    version: "*",
    files: [{ content: source }],
    stdin,
  };

  const response = await axios.post(env.PISTON_URL, payload, {
    timeout: 10_000,
  });

  return response.data as {
    run: { stdout: string; stderr: string; code: number; signal: string | null };
  };
}
