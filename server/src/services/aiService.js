const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-8b-instruct:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const extractJsonObject = (text) => {
  if (!text || typeof text !== "string") {
    return null;
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = text.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(candidate);
  } catch (_error) {
    return null;
  }
};

const fallbackEstimate = (task) => {
  const titleLength = (task.title || "").trim().length;
  const descriptionLength = (task.description || "").trim().length;
  const complexity = titleLength + descriptionLength;
  const priorityBoost = task.priority === "high" ? 2 : task.priority === "medium" ? 1 : 0;

  const roughEstimate = Math.ceil(complexity / 160) + priorityBoost;
  const estimate = clamp(roughEstimate || 1, 1, 8);

  return {
    estimate,
    reasoning:
      "Estimated from task length and priority because AI provider is unavailable.",
    source: "fallback",
  };
};

const summarizeForInsights = (sessionHistory, taskHistory) => {
  const totalSessions = sessionHistory.length;
  const completedSessions = sessionHistory.filter((session) => !session.interrupted).length;
  const interruptedSessions = totalSessions - completedSessions;
  const interruptionRate = totalSessions
    ? Number(((interruptedSessions / totalSessions) * 100).toFixed(1))
    : 0;
  const focusSeconds = sessionHistory.reduce((sum, session) => {
    if (session.type !== "work" || session.interrupted) {
      return sum;
    }

    return sum + Number(session.duration || 0);
  }, 0);
  const completionRate = taskHistory.length
    ? Number(
        ((taskHistory.filter((task) => task.completed).length / taskHistory.length) * 100).toFixed(1)
      )
    : 0;

  return {
    totalSessions,
    completedSessions,
    interruptedSessions,
    interruptionRate,
    focusHours: Number((focusSeconds / 3600).toFixed(2)),
    totalTasks: taskHistory.length,
    taskCompletionRate: completionRate,
  };
};

const fallbackInsights = (sessionHistory, taskHistory) => {
  const summary = summarizeForInsights(sessionHistory, taskHistory);
  const tips = [];

  if (summary.interruptionRate > 45) {
    tips.push("Your interruption rate is high. Try muting notifications for one focus block.");
  } else {
    tips.push("Your sessions are fairly consistent. Keep using the same start-time routine.");
  }

  if (summary.taskCompletionRate < 50) {
    tips.push("Break larger tasks into smaller todos so more tasks can be closed each day.");
  } else {
    tips.push("Your task completion trend is strong. Front-load your highest-priority tasks.");
  }

  if (summary.focusHours < 2) {
    tips.push("Aim for at least two uninterrupted work sessions before lunch.");
  } else {
    tips.push("Protect your top focus window and reserve admin work for lower-energy hours.");
  }

  return {
    tips: tips.slice(0, 3),
    summary,
    source: "fallback",
  };
};

const callOpenRouterJson = async ({
  systemPrompt,
  userPrompt,
  maxTokens = 350,
  temperature = 0.2,
}) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:5000",
      "X-Title": process.env.OPENROUTER_APP_NAME || "TaskFlow",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter response did not include message content");
  }

  const parsed = typeof content === "object" ? content : extractJsonObject(String(content));
  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenRouter response was not valid JSON");
  }

  return parsed;
};

const estimatePomodoros = async (task) => {
  try {
    const parsed = await callOpenRouterJson({
      systemPrompt:
        "You are a productivity assistant. Return only JSON with keys: estimate (integer 1-8) and reasoning (one sentence).",
      userPrompt: `Task title: ${task.title || ""}\nTask description: ${
        task.description || ""
      }\nPriority: ${task.priority || "medium"}`,
      maxTokens: 120,
    });

    const estimate = clamp(Number(parsed.estimate) || 1, 1, 8);
    const reasoning =
      typeof parsed.reasoning === "string" && parsed.reasoning.trim()
        ? parsed.reasoning.trim()
        : "Estimated by AI based on task details.";

    return { estimate, reasoning, source: "openrouter" };
  } catch (_error) {
    return fallbackEstimate(task);
  }
};

const generateInsights = async (sessionHistory, taskHistory) => {
  const summary = summarizeForInsights(sessionHistory, taskHistory);

  try {
    const parsed = await callOpenRouterJson({
      systemPrompt:
        "You are a productivity coach. Return only JSON: {\"tips\": [\"tip1\", \"tip2\", \"tip3\"]}. Provide 2-3 actionable, concise tips.",
      userPrompt: `Generate advice using this summary JSON:\n${JSON.stringify(summary)}`,
      maxTokens: 250,
      temperature: 0.5,
    });

    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.map((tip) => String(tip).trim()).filter(Boolean).slice(0, 3)
      : [];

    if (!tips.length) {
      throw new Error("No tips returned");
    }

    return { tips, summary, source: "openrouter" };
  } catch (_error) {
    return fallbackInsights(sessionHistory, taskHistory);
  }
};

module.exports = {
  estimatePomodoros,
  generateInsights,
};
