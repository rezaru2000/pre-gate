import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import {
  getAdminByEmail,
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getResponsesBySurveyId,
} from '../db/queries';
import { config } from '../config/env';
import logger from '../utils/logger';

const router = Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  const correlationId = res.locals['correlationId'] as string;

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials.' });
    return;
  }

  const { email, password } = parsed.data;

  const admin = await getAdminByEmail(email);
  if (!admin) {
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    logger.warn('admin login failed', { correlationId, email, ip: req.ip });
    res.status(401).json({ error: 'Invalid credentials.' });
    return;
  }

  const token = jwt.sign(
    { adminId: admin.id, email: admin.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );

  // SameSite=None+Secure is required for cross-origin cookie sending
  // (frontend on azurestaticapps.net, API on azurecontainerapps.io)
  // SameSite=Strict is safe for local dev where both run on localhost
  const crossOrigin = config.nodeEnv !== 'development';
  res.cookie('pregate_token', token, {
    httpOnly: true,
    secure: crossOrigin,
    sameSite: crossOrigin ? 'none' : 'strict',
    maxAge: 8 * 60 * 60 * 1000,
  });

  logger.info('admin login', { correlationId, email, ip: req.ip });
  res.json({ success: true, email: admin.email });
});

router.post('/logout', (_req: Request, res: Response) => {
  const crossOrigin = config.nodeEnv !== 'development';
  res.clearCookie('pregate_token', {
    httpOnly: true,
    secure: crossOrigin,
    sameSite: crossOrigin ? 'none' : 'strict',
  });
  res.json({ success: true });
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ email: res.locals['admin']?.email });
});

// ─── Surveys ──────────────────────────────────────────────────────────────────

router.get('/surveys', requireAuth, async (_req: Request, res: Response) => {
  const surveys = await getSurveys();
  res.json(surveys);
});

router.get('/surveys/:id', requireAuth, async (req: Request, res: Response) => {
  const survey = await getSurveyById(req.params['id']!);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found.' });
    return;
  }
  res.json(survey);
});

const CreateSurveySchema = z.object({
  name: z.string().min(1).max(200),
  actualUrl: z.string().url(),
  passMarkPercent: z.number().int().min(1).max(100).default(80),
  questionsPerSession: z.number().int().min(0).max(50).default(5),
});

router.post('/surveys', requireAuth, async (req: Request, res: Response) => {
  const correlationId = res.locals['correlationId'] as string;

  const parsed = CreateSurveySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const survey = await createSurvey(parsed.data);
  logger.info('survey created', { correlationId, surveyId: survey.id, admin: res.locals['admin']?.email });
  res.status(201).json(survey);
});

const UpdateSurveySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  actualUrl: z.string().url().optional(),
  passMarkPercent: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  questionsPerSession: z.number().int().min(0).max(50).optional(),
});

router.patch('/surveys/:id', requireAuth, async (req: Request, res: Response) => {
  const correlationId = res.locals['correlationId'] as string;

  const parsed = UpdateSurveySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const survey = await updateSurvey(req.params['id']!, parsed.data);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found.' });
    return;
  }

  logger.info('survey updated', { correlationId, surveyId: survey.id, admin: res.locals['admin']?.email });
  res.json(survey);
});

// ─── Questions ────────────────────────────────────────────────────────────────

router.get('/surveys/:surveyId/questions', requireAuth, async (_req: Request, res: Response) => {
  const questions = await getQuestions();
  res.json(questions);
});

const CreateQuestionSchema = z.object({
  questionText: z.string().min(1),
  controlType: z.enum(['radio', 'checkbox', 'true_false', 'text']),
  correctAnswers: z.array(z.string()).min(1),
  options: z.array(z.string()).min(2).max(6).optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
});

router.post('/surveys/:surveyId/questions', requireAuth, async (req: Request, res: Response) => {
  const correlationId = res.locals['correlationId'] as string;

  const parsed = CreateQuestionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const question = await createQuestion(parsed.data);
  logger.info('question added', { correlationId, questionId: question.id, admin: res.locals['admin']?.email });
  res.status(201).json(question);
});

const UpdateQuestionSchema = z.object({
  questionText: z.string().min(1).optional(),
  controlType: z.enum(['radio', 'checkbox', 'true_false', 'text']).optional(),
  correctAnswers: z.array(z.string()).min(1).optional(),
  options: z.array(z.string()).min(2).max(6).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
});

router.patch('/questions/:id', requireAuth, async (req: Request, res: Response) => {
  const correlationId = res.locals['correlationId'] as string;

  const parsed = UpdateQuestionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const question = await updateQuestion(req.params['id']!, parsed.data);
  if (!question) {
    res.status(404).json({ error: 'Question not found.' });
    return;
  }

  logger.info('question updated', { correlationId, questionId: question.id, admin: res.locals['admin']?.email });
  res.json(question);
});

router.delete('/questions/:id', requireAuth, async (req: Request, res: Response) => {
  const correlationId = res.locals['correlationId'] as string;

  await deleteQuestion(req.params['id']!);
  logger.info('question deleted', { correlationId, questionId: req.params['id'], admin: res.locals['admin']?.email });
  res.status(204).send();
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

router.get('/surveys/:surveyId/responses', requireAuth, async (req: Request, res: Response) => {
  const responses = await getResponsesBySurveyId(req.params['surveyId']!);
  res.json(responses);
});

export default router;
