import axios from "axios";
import { env } from "../config/env.js";
export async function executeCode({ language, source, stdin = "" }) {
    const payload = {
        language,
        version: "*",
        files: [{ content: source }],
        stdin,
    };
    const response = await axios.post(env.PISTON_URL, payload, {
        timeout: 10_000,
    });
    return response.data;
}
