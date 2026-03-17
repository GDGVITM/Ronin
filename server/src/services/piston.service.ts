import axios from "axios";
import { env } from "../config/env.js";

type RunParams = {
  language: string;
  source: string;
  stdin?: string;
};

function normalizeJavaSource(source: string): string {
  const hasMainClass = /\b(?:public\s+)?class\s+Main\b/.test(source);
  if (hasMainClass) return source;

  if (/\bpublic\s+class\s+[A-Za-z_][A-Za-z0-9_]*\b/.test(source)) {
    return source.replace(/\bpublic\s+class\s+[A-Za-z_][A-Za-z0-9_]*\b/, "public class Main");
  }

  return source;
}

export async function executeCode({ language, source, stdin = "" }: RunParams) {
  const normalizedSource = language === "java" ? normalizeJavaSource(source) : source;

  const payload = {
    language,
    version: "*",
    files: [
      language === "java"
        ? { name: "Main.java", content: normalizedSource }
        : { content: normalizedSource },
    ],
    stdin,
  };

  const response = await axios.post(env.PISTON_URL, payload, {
    timeout: 10_000,
  });

  return response.data as {
    compile?: { stdout: string; stderr: string; code: number; signal: string | null };
    run: { stdout: string; stderr: string; code: number; signal: string | null };
  };
}
