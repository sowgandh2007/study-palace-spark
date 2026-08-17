import { getApiConfig, cleanAndParseJSON, ECHOAIError, callGeminiREST, getResolvedGeminiKey } from "./llm";
import { StudyPlanData } from "./types";

export async function generateStructuredStudyPlan(
  concept: string,
  daysAvailable: number,
  hoursPerDay: number,
  understoodText?: string,
  notUnderstoodText?: string,
  confidenceScore = 75
): Promise<StudyPlanData> {
  if (!concept || !concept.trim()) {
    throw new ECHOAIError("Invalid request: concept is required for study plan generation.", "INVALID_RESPONSE", 400);
  }

  const cfg = getApiConfig();
  const apiKey = getResolvedGeminiKey();

  const totalMinutes = daysAvailable * hoursPerDay * 60;
  const bufferMinutes = Math.floor(totalMinutes * 0.15); // 15% buffer
  const usableMinutes = totalMinutes - bufferMinutes;

  const prompt = `You are ECHO, an Evidence-Based Conceptual Honesty Engine.
Generate a structured, day-by-day study schedule for the concept: "${concept}".
Student Self-Reported Confidence: ${confidenceScore}%
Student Understood: "${understoodText || "Baseline familiarity"}"
Student Struggling With: "${notUnderstoodText || "Boundary conditions and core invariants"}"

CONSTRAINTS:
1. Days Available: ${daysAvailable} days
2. Max Study Time per Day: ${hoursPerDay} hours (${hoursPerDay * 60} mins)
3. Total Usable Study Time (excl buffer): ${usableMinutes} mins
4. Break down the topic into logical sub-topics.
5. Assign a priority (HIGH, MEDIUM, LOW) based on importance and student weaknesses.
6. Assign a realistic duration (45-90 mins per task usually). Do not exceed daily max.
7. Include active learning tasks (LEARN, PRACTICE, REVIEW, ASSESS, REFLECT).
8. Ensure earlier days focus on fundamentals, later days on practice and review.
9. Distribute tasks logically across the days.

RETURN FORMAT:
Return strictly valid JSON with this structure:
{
  "title": "${concept} Preparation Plan",
  "topic": "${concept}",
  "startDate": "2026-08-18",
  "endDate": "2026-08-${18 + daysAvailable - 1}",
  "totalStudyMinutes": ${usableMinutes},
  "days": [
    {
      "dayIndex": 1,
      "date": "Day 1",
      "focus": "Core Fundamentals",
      "tasks": [
        {
          "id": "task-1",
          "topic": "Arrays & Memory",
          "priority": "HIGH",
          "difficulty": "MEDIUM",
          "type": "LEARN",
          "durationMinutes": 45,
          "completed": false
        }
      ]
    }
  ]
}
`;

  const text = await callGeminiREST(prompt, apiKey, cfg.geminiModel || "gemini-3.5-flash", undefined, "structured_study_plan");
  
  try {
    const parsed = cleanAndParseJSON<StudyPlanData>(text);
    
    // Ensure all tasks have required fields and unique IDs
    parsed.days.forEach((day, dIdx) => {
      day.tasks.forEach((task, tIdx) => {
        if (!task.id) task.id = `task-${dIdx}-${tIdx}-${Math.random().toString(36).substring(2, 9)}`;
        if (typeof task.completed !== 'boolean') task.completed = false;
      });
    });

    return parsed;
  } catch (err) {
    console.error("Failed to parse structured study plan", err);
    throw new ECHOAIError("Failed to generate a valid study schedule. Please try again.", "PARSE_ERROR", 500);
  }
}
