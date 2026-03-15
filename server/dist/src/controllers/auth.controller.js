import { z } from "zod";
import { loginUser, registerUser } from "../services/auth.service.js";
const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    college: z.string().min(2),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export async function register(req, res) {
    try {
        const body = registerSchema.parse(req.body);
        const user = await registerUser(body);
        return res.status(201).json({
            message: "Registered successfully. Awaiting admin approval.",
            user,
        });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function login(req, res) {
    try {
        const body = loginSchema.parse(req.body);
        const data = await loginUser(body.email, body.password);
        return res.json(data);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
