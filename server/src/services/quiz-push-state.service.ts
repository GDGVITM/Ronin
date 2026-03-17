type CurrentRound2Question = {
  id: string;
  questionText: string;
  codeSnippet: string;
  options: unknown;
  timeLimit: number;
  points: number;
  pushedAt: string;
};

let currentRound2Question: CurrentRound2Question | null = null;
const pushedRound2QuestionIds = new Set<string>();

export function getCurrentRound2QuestionState() {
  return currentRound2Question;
}

export function isRound2QuestionPushed(questionId: string) {
  return pushedRound2QuestionIds.has(questionId);
}

export function markRound2QuestionPushed(payload: CurrentRound2Question) {
  currentRound2Question = payload;
  pushedRound2QuestionIds.add(payload.id);
}

export function clearRound2PushState() {
  currentRound2Question = null;
  pushedRound2QuestionIds.clear();
}
