import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

interface Question {
  id: string;
  question_text: string;
  control_type: 'radio' | 'checkbox' | 'true_false';
  display_order: number;
}

interface SurveyData {
  surveyId: string;
  name: string;
  questions: Question[];
}

type PageState = 'loading' | 'error' | 'survey' | 'submitting' | 'passed' | 'failed';

export default function ScreeningPage() {
  const { inviteUuid } = useParams<{ inviteUuid: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const sessionId = useRef(uuidv4());
  const startedAt = useRef(new Date().toISOString());

  useEffect(() => {
    if (!inviteUuid) {
      setErrorMsg('Invalid survey link.');
      setPageState('error');
      return;
    }

    fetch(`${config.apiBaseUrl}/api/survey/${inviteUuid}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? 'Survey not found.');
        }
        return res.json();
      })
      .then((data: SurveyData) => {
        setSurvey(data);
        setPageState('survey');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setPageState('error');
      });
  }, [inviteUuid]);

  function handleRadioChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleCheckboxChange(questionId: string, value: string, checked: boolean) {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[] | undefined) ?? [];
      return {
        ...prev,
        [questionId]: checked ? [...current, value] : current.filter((v) => v !== value),
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!survey) return;

    setPageState('submitting');

    try {
      const res = await fetch(`${config.apiBaseUrl}/api/survey/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: survey.surveyId,
          sessionId: sessionId.current,
          answers,
          startedAt: startedAt.current,
          honeypot: '',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Submission failed. Please try again.');
        setPageState('failed');
        return;
      }

      if (data.passed) {
        setPageState('passed');
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 2000);
      } else {
        setPageState('failed');
      }
    } catch {
      setErrorMsg('A network error occurred. Please try again.');
      setPageState('failed');
    }
  }

  function renderQuestion(q: Question) {
    const options =
      q.control_type === 'true_false'
        ? ['True', 'False']
        : q.control_type === 'radio'
        ? ['Option A', 'Option B', 'Option C', 'Option D']
        : ['Option A', 'Option B', 'Option C', 'Option D'];

    if (q.control_type === 'checkbox') {
      return (
        <div key={q.id} style={styles.questionBlock}>
          <p style={styles.questionText}>{q.question_text}</p>
          {options.map((opt) => (
            <label key={opt} style={styles.optionLabel}>
              <input
                type="checkbox"
                name={q.id}
                value={opt}
                onChange={(e) => handleCheckboxChange(q.id, opt, e.target.checked)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <div key={q.id} style={styles.questionBlock}>
        <p style={styles.questionText}>{q.question_text}</p>
        {options.map((opt) => (
          <label key={opt} style={styles.optionLabel}>
            <input
              type="radio"
              name={q.id}
              value={opt}
              onChange={() => handleRadioChange(q.id, opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (pageState === 'loading') {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <p style={styles.loadingText}>Loading survey...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Survey Unavailable</h2>
          <p style={styles.body}>{errorMsg || 'This survey link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  if (pageState === 'passed') {
    return (
      <div style={styles.center}>
        <div style={{ ...styles.card, ...styles.successCard }}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.heading}>Verification Complete</h2>
          <p style={styles.body}>Redirecting you to the survey...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'failed') {
    return (
      <div style={styles.center}>
        <div style={{ ...styles.card, ...styles.failCard }}>
          <h2 style={styles.heading}>Verification Unsuccessful</h2>
          <p style={styles.body}>
            {errorMsg || "Unfortunately we weren't able to verify you at this time. Please contact the survey organiser for assistance."}
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'submitting') {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <p style={styles.loadingText}>Verifying your answers...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Survey Verification</h1>
          <p style={styles.subtitle}>{survey?.name}</p>
          <p style={styles.instructions}>
            Please answer all questions to verify you're a real person and gain access to the survey.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Honeypot — hidden from real users */}
          <input
            type="text"
            name="website"
            defaultValue=""
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {survey?.questions.map((q) => renderQuestion(q))}

          <button type="submit" style={styles.submitButton}>
            Submit Answers
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '2rem 1rem',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 0.25rem',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#4a5568',
    margin: '0 0 1rem',
  },
  instructions: {
    fontSize: '0.95rem',
    color: '#718096',
    background: '#edf2f7',
    borderRadius: 8,
    padding: '0.75rem 1rem',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  questionBlock: {
    background: '#fff',
    borderRadius: 10,
    padding: '1.25rem 1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  questionText: {
    fontWeight: 600,
    fontSize: '1rem',
    color: '#1a1a2e',
    margin: '0 0 0.75rem',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0',
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#2d3748',
  },
  submitButton: {
    background: '#4361ee',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '0.875rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '0.5rem',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '2.5rem',
    maxWidth: 480,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  successCard: {
    borderTop: '4px solid #48bb78',
  },
  failCard: {
    borderTop: '4px solid #fc8181',
  },
  heading: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 0.75rem',
  },
  body: {
    color: '#4a5568',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    margin: 0,
  },
  loadingText: {
    color: '#718096',
    fontSize: '1rem',
    margin: 0,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#f0fff4',
    color: '#48bb78',
    fontSize: '1.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
  },
};
