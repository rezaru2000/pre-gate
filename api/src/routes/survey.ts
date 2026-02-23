import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  getSurveyByInviteUuid,
  getPublicQuestionsBySurveyId,
  getQuestionsBySurveyId,
  createResponse,
} from '../db/queries';
import { config } from '../config/env';
import logger from '../utils/logger';

const router = Router();

// GET /api/survey/:inviteUuid — load survey + questions (public)
router.get('/:inviteUuid', async (req: Request, res: Response) => {
  const { inviteUuid } = req.params;
  const correlationId = res.locals['correlationId'] as string;

  const survey = await getSurveyByInviteUuid(inviteUuid);

  if (!survey || !survey.is_active) {
    res.status(404).json({ error: 'Survey not found or inactive.' });
    return;
  }

  const questions = await getPublicQuestionsBySurveyId(survey.id);

  logger.info('survey loaded', { correlationId, surveyId: survey.id });

  res.json({
    surveyId: survey.id,
    name: survey.name,
    questions,
  });
});

const SubmitSchema = z.object({
  surveyId: z.string().uuid(),
  sessionId: z.string().min(1),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  startedAt: z.string().datetime(),
  honeypot: z.string().optional(),
});

// POST /api/survey/submit
router.post('/submit', async (req: Request, res: Response) => {
  const correlationId = res.locals['correlationId'] as string;
  const ip = req.ip ?? 'unknown';
  const userAgent = req.get('user-agent') ?? 'unknown';

  const parsed = SubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid submission data.', details: parsed.error.flatten() });
    return;
  }

  const { surveyId, sessionId, answers, startedAt, honeypot } = parsed.data;

  // Bot detection: honeypot
  if (honeypot && honeypot.length > 0) {
    logger.warn('bot detected: honeypot filled', { correlationId, ip, surveyId });
    res.status(400).json({ error: 'Submission rejected.' });
    return;
  }

  // Bot detection: time check
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  if (elapsed < config.minSubmissionTimeSeconds) {
    logger.warn('bot detected: submission too fast', {
      correlationId,
      ip,
      surveyId,
      elapsedSeconds: elapsed,
      minSeconds: config.minSubmissionTimeSeconds,
    });
    res.status(400).json({ error: 'Submission rejected.' });
    return;
  }

  // Load questions with correct answers (admin view)
  const questions = await getQuestionsBySurveyId(surveyId);
  if (!questions || questions.length === 0) {
    res.status(404).json({ error: 'Survey not found.' });
    return;
  }

  // Score the submission
  let correct = 0;
  for (const q of questions) {
    const correctAnswers: string[] = q.correct_answers;
    const userAnswer = answers[q.id];

    if (!userAnswer) continue;

    const userAnswerArr = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    const isCorrect =
      correctAnswers.length === userAnswerArr.length &&
      correctAnswers.every((a: string) => userAnswerArr.includes(a));

    if (isCorrect) correct++;
  }

  const scorePercent = questions.length > 0 ? (correct / questions.length) * 100 : 0;

  // Load survey to get pass mark and actual URL
  const { getSurveyById } = await import('../db/queries');
  const survey = await getSurveyById(surveyId);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found.' });
    return;
  }

  const passed = scorePercent >= survey.pass_mark_percent;

  // Save response
  await createResponse({
    surveyId,
    userSessionId: sessionId,
    answers,
    scorePercent,
    passed,
    ipAddress: ip,
    userAgent,
  });

  logger.info('survey submitted', {
    correlationId,
    surveyId,
    sessionId,
    scorePercent,
    passed,
    ip,
  });

  if (passed) {
    res.json({ passed: true, redirectUrl: survey.actual_url });
  } else {
    res.json({ passed: false });
  }
});

export default router;
