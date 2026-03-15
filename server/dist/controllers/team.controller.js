import { createTeam, getMyTeam, joinTeam } from "../services/team.service.js";
export async function createMyTeam(req, res) {
    try {
        const userId = req.auth.userId;
        const name = req.body?.name ?? "";
        const team = await createTeam(userId, name);
        return res.status(201).json(team);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function joinMyTeam(req, res) {
    try {
        const userId = req.auth.userId;
        const inviteCode = req.body?.inviteCode ?? "";
        const team = await joinTeam(userId, inviteCode);
        return res.json(team);
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
}
export async function fetchMyTeam(req, res) {
    const team = await getMyTeam(req.auth.userId);
    return res.json({ team });
}
