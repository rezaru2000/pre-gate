import { pool } from './pool';
import logger from '../utils/logger';

// ─── Surveys ──────────────────────────────────────────────────────────────────

export async function getSurveys() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, actual_url, pass_mark_percent, invite_uuid, is_active, created_at, updated_at
       FROM surveys ORDER BY created_at DESC`
    );
    return rows;
  } catch (err) {
    logger.error('db error: getSurveys', { message: (err as Error).message });
    throw err;
  }
}

export async function getSurveyByInviteUuid(inviteUuid: string) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, pass_mark_percent, is_active FROM surveys WHERE invite_uuid = $1`,
      [inviteUuid]
    );
    return rows[0] ?? null;
  } catch (err) {
    logger.error('db error: getSurveyByInviteUuid', { message: (err as Error).message });
    throw err;
  }
}

export async function getSurveyById(id: string) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, actual_url, pass_mark_percent, invite_uuid, is_active, created_at, updated_at
       FROM surveys WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  } catch (err) {
    logger.error('db error: getSurveyById', { message: (err as Error).message });
    throw err;
  }
}

export async function createSurvey(data: {
  name: string;
  actualUrl: string;
  passMarkPercent: number;
}) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO surveys (name, actual_url, pass_mark_percent)
       VALUES ($1, $2, $3)
       RETURNING id, name, actual_url, pass_mark_percent, invite_uuid, is_active, created_at, updated_at`,
      [data.name, data.actualUrl, data.passMarkPercent]
    );
    return rows[0];
  } catch (err) {
    logger.error('db error: createSurvey', { message: (err as Error).message });
    throw err;
  }
}

export async function updateSurvey(
  id: string,
  data: { name?: string; actualUrl?: string; passMarkPercent?: number; isActive?: boolean }
) {
  try {
    const { rows } = await pool.query(
      `UPDATE surveys SET
         name = COALESCE($2, name),
         actual_url = COALESCE($3, actual_url),
         pass_mark_percent = COALESCE($4, pass_mark_percent),
         is_active = COALESCE($5, is_active),
         updated_at = now()
       WHERE id = $1
       RETURNING id, name, actual_url, pass_mark_percent, invite_uuid, is_active, created_at, updated_at`,
      [id, data.name, data.actualUrl, data.passMarkPercent, data.isActive]
    );
    return rows[0] ?? null;
  } catch (err) {
    logger.error('db error: updateSurvey', { message: (err as Error).message });
    throw err;
  }
}

// ─── Questions ────────────────────────────────────────────────────────────────

export async function getQuestionsBySurveyId(surveyId: string) {
  try {
    const { rows } = await pool.query(
      `SELECT id, survey_id, question_text, control_type, correct_answers, display_order, created_at
       FROM questions WHERE survey_id = $1 ORDER BY display_order ASC`,
      [surveyId]
    );
    return rows;
  } catch (err) {
    logger.error('db error: getQuestionsBySurveyId', { message: (err as Error).message });
    throw err;
  }
}

export async function getPublicQuestionsBySurveyId(surveyId: string) {
  try {
    const { rows } = await pool.query(
      `SELECT id, question_text, control_type, display_order
       FROM questions WHERE survey_id = $1 ORDER BY display_order ASC`,
      [surveyId]
    );
    return rows;
  } catch (err) {
    logger.error('db error: getPublicQuestionsBySurveyId', { message: (err as Error).message });
    throw err;
  }
}

export async function createQuestion(data: {
  surveyId: string;
  questionText: string;
  controlType: string;
  correctAnswers: string[];
  displayOrder: number;
}) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO questions (survey_id, question_text, control_type, correct_answers, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, survey_id, question_text, control_type, correct_answers, display_order, created_at`,
      [data.surveyId, data.questionText, data.controlType, JSON.stringify(data.correctAnswers), data.displayOrder]
    );
    return rows[0];
  } catch (err) {
    logger.error('db error: createQuestion', { message: (err as Error).message });
    throw err;
  }
}

export async function updateQuestion(
  id: string,
  data: { questionText?: string; controlType?: string; correctAnswers?: string[]; displayOrder?: number }
) {
  try {
    const { rows } = await pool.query(
      `UPDATE questions SET
         question_text = COALESCE($2, question_text),
         control_type = COALESCE($3, control_type),
         correct_answers = COALESCE($4, correct_answers),
         display_order = COALESCE($5, display_order)
       WHERE id = $1
       RETURNING id, survey_id, question_text, control_type, correct_answers, display_order, created_at`,
      [
        id,
        data.questionText,
        data.controlType,
        data.correctAnswers ? JSON.stringify(data.correctAnswers) : null,
        data.displayOrder,
      ]
    );
    return rows[0] ?? null;
  } catch (err) {
    logger.error('db error: updateQuestion', { message: (err as Error).message });
    throw err;
  }
}

export async function deleteQuestion(id: string) {
  try {
    await pool.query(`DELETE FROM questions WHERE id = $1`, [id]);
  } catch (err) {
    logger.error('db error: deleteQuestion', { message: (err as Error).message });
    throw err;
  }
}

// ─── Responses ────────────────────────────────────────────────────────────────

export async function createResponse(data: {
  surveyId: string;
  userSessionId: string;
  answers: Record<string, unknown>;
  scorePercent: number;
  passed: boolean;
  ipAddress: string;
  userAgent: string;
}) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO responses (survey_id, user_session_id, answers, score_percent, passed, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, submitted_at`,
      [
        data.surveyId,
        data.userSessionId,
        JSON.stringify(data.answers),
        data.scorePercent,
        data.passed,
        data.ipAddress,
        data.userAgent,
      ]
    );
    return rows[0];
  } catch (err) {
    logger.error('db error: createResponse', { message: (err as Error).message });
    throw err;
  }
}

export async function getResponsesBySurveyId(surveyId: string) {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_session_id, answers, score_percent, passed, ip_address, user_agent, submitted_at
       FROM responses WHERE survey_id = $1 ORDER BY submitted_at DESC`,
      [surveyId]
    );
    return rows;
  } catch (err) {
    logger.error('db error: getResponsesBySurveyId', { message: (err as Error).message });
    throw err;
  }
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export async function getAdminByEmail(email: string) {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, password_hash FROM admin_users WHERE email = $1`,
      [email]
    );
    return rows[0] ?? null;
  } catch (err) {
    logger.error('db error: getAdminByEmail', { message: (err as Error).message });
    throw err;
  }
}

export async function createAdminUser(email: string, passwordHash: string) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, passwordHash]
    );
    return rows[0];
  } catch (err) {
    logger.error('db error: createAdminUser', { message: (err as Error).message });
    throw err;
  }
}
