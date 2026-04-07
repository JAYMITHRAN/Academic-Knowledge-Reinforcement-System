// src/services/ai.service.js
require('dotenv').config();
const Groq   = require('groq-sdk');
const pool   = require('../config/db');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Question Generation ──────────────────────────────────────────────────────
/**
 * generateQuestions
 * Calls Groq to produce 10 real-world scenario-based descriptive questions
 * for a given course unit.  Returns an array of { id, question } objects.
 */
const generateQuestions = async (courseId, unitNumber) => {
  // Fetch unit metadata from DB
  const [units] = await pool.execute(
    'SELECT title, description FROM course_units WHERE course_id = ? AND unit_number = ?',
    [courseId, unitNumber]
  );

  const unit = units[0] || { title: `Unit ${unitNumber}`, description: 'Course content' };

  const systemPrompt = `You are an expert academic examiner. Your task is to create 10 thought-provoking, 
real-world scenario-based exam questions for a university-level course unit.

Rules:
1. Questions must describe a realistic situation or problem scenario.
2. Questions must ask "how" or "what would you do" or "explain your approach" — encouraging descriptive, 
   theoretical reasoning, NOT multiple choice.
3. Each question should require at least 3–5 sentences to answer properly.
4. Focus on problem-solving, analysis, and application of knowledge.
5. Return ONLY a valid JSON array with this exact structure, no markdown, no extra text:
[
  { "id": 1, "question": "..." },
  { "id": 2, "question": "..." },
  ...
  { "id": 10, "question": "..." }
]`;

  const userPrompt = `Generate 10 exam questions for the following unit:
Unit Title: ${unit.title}
Unit Description: ${unit.description || 'General concepts related to this topic.'}`;

  try {
    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.7,
      max_tokens:  2048,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';

    // Extract JSON array even if wrapped in markdown code fences
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const questions = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Groq did not return a valid question array');
    }

    // Ensure correct ids 1-based
    return questions.map((q, i) => ({ id: i + 1, question: q.question }));
  } catch (err) {
    console.error('Groq generateQuestions error:', err.message);
    // Fallback: return a single placeholder so the app doesn't crash
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      question: `(Fallback Q${i + 1}) Describe a real-world challenge related to ${unit.title} and explain how you would solve it.`,
    }));
  }
};

// ─── Answer Evaluation ────────────────────────────────────────────────────────
/**
 * evaluateAnswers
 * Sends questions + student answers to Groq.
 * Returns { totalScore, maxScore:10, perQuestion: [{ id, score, feedback }] }
 *
 * Each answer is scored out of 10.  Total is averaged and returned 0-10.
 */
const evaluateAnswers = async (questions, answers, unitTitle) => {
  // Build a readable Q&A string for Groq
  const qaBlock = questions
    .map((q) => {
      const ans = answers[q.id] || '(No answer provided)';
      return `Q${q.id}: ${q.question}\nStudent Answer: ${ans}`;
    })
    .join('\n\n');

  const systemPrompt = `You are a strict but fair university examiner. 
Evaluate each student answer based on:
- Relevance to the question (0-3 marks)
- Depth of explanation and reasoning (0-4 marks)  
- Real-world applicability and examples given (0-3 marks)

Return ONLY a valid JSON array (no markdown, no extra text):
[
  { "id": 1, "score": <0-10>, "feedback": "<one concise sentence>" },
  ...
]`;

  const userPrompt = `Topic: ${unitTitle}

${qaBlock}`;

  try {
    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages:    [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      temperature: 0.3,
      max_tokens:  2048,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const perQuestion = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    if (!Array.isArray(perQuestion) || perQuestion.length === 0) {
      throw new Error('Groq did not return a valid evaluation array');
    }

    const totalScore = perQuestion.reduce((sum, r) => sum + (Number(r.score) || 0), 0);

    return {
      totalScore,
      maxScore:    perQuestion.length * 10,
      perQuestion,
    };
  } catch (err) {
    console.error('Groq evaluateAnswers error:', err.message);
    // Fallback: give partial marks to avoid blocking the flow
    const perQuestion = questions.map((q) => ({
      id:       q.id,
      score:    5,
      feedback: 'Auto-graded (AI evaluation unavailable at this time).',
    }));
    return { totalScore: 50, maxScore: questions.length * 10, perQuestion };
  }
};

module.exports = { generateQuestions, evaluateAnswers };
