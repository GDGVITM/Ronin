import { prisma } from "../config/prisma.js";
import { executeCode } from "./piston.service.js";
export async function runAgainstProblem(problemId, language, code) {
    const problem = await prisma.problem.findUnique({
        where: { id: problemId },
        include: { testCases: true },
    });
    if (!problem) {
        throw new Error("Problem not found.");
    }
    let passed = 0;
    for (const testCase of problem.testCases) {
        const result = await executeCode({
            language,
            source: code,
            stdin: testCase.input,
        });
        const output = (result.run.stdout ?? "").trim();
        if (output === testCase.expected.trim()) {
            passed += 1;
        }
    }
    return {
        passedTests: passed,
        totalTests: problem.testCases.length,
        accepted: passed === problem.testCases.length,
    };
}
