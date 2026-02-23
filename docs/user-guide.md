# PreGate User Guide

PreGate is a human-verification screening tool. Before a respondent can access your survey, they complete a short quiz that filters out bots and ensures only genuine human participants get through.

---

## For Survey Organisers (Admins)

### Logging In

1. Go to your PreGate admin URL (e.g. `https://your-site.com/admin`)
2. Enter your email and password
3. You will land on the **Surveys** dashboard

---

### Creating a Survey

1. Click **+ New Survey**
2. Fill in the form:
   - **Survey Name** — a label to identify this screening (e.g. "Customer Feedback Q1")
   - **Actual Survey URL** — the real survey link respondents are redirected to after passing (e.g. your SurveyMonkey or Typeform URL)
   - **Pass Mark (%)** — minimum score required to pass (default: 80%)
   - **Questions per session** — how many random questions each respondent sees (default: 5; set to 0 to show all)
3. Click **Create**

The survey will appear in the list with a **Share with User** link.

---

### Sharing the Screening Link

Each survey has a unique screening link shown in the survey list:

> **Share with User:** `https://your-site.com/s/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

- Click the link to preview it yourself
- Copy and send this link to your respondents (email, Slack, etc.)
- Do **not** share the actual survey URL directly — only share the PreGate link

---

### Viewing Responses

1. In the survey list, click **Responses** next to any survey
2. You will see each submission with:
   - Date and time
   - Score
   - Pass / Fail result
   - Individual answers

Use this view to audit participation or spot unusual patterns.

---

### Managing Questions

Questions are drawn from a **global pool** shared across all surveys. Each respondent sees a random selection. To add or edit questions, contact your PreGate administrator or refer to the admin question management page.

Question types supported:
- **True / False** — respondent picks True or False
- **Multiple choice (radio)** — respondent picks one option
- **Multiple select (checkbox)** — respondent selects all that apply
- **Text** — respondent types a short answer (checked against accepted values)

---

## For Respondents (Survey Participants)

### What Is This?

When you receive a PreGate link, you will be asked a short set of questions before you can access the actual survey. This is a quick human-verification step — it is not a test of knowledge, just a way to confirm you are a real person.

### How to Complete the Screening

1. Open the link you were sent
2. Read each question carefully and select or type your answer
3. Click **Submit Answers**

**Result:**

| Outcome | What happens |
|---|---|
| **Pass** | You are automatically redirected to the survey within a few seconds |
| **Fail** | You will see a message — contact the survey organiser for assistance |

### Tips

- Answer all questions before submitting
- For checkbox questions, select **all** correct options
- For text questions, type your answer exactly as prompted
- There is no time limit

---

## Frequently Asked Questions

**Can I retake the screening if I fail?**
This depends on the organiser's settings. If you fail, contact the person who sent you the link.

**Is my data stored?**
Your answers and score are recorded for the organiser to review. No personally identifiable information beyond your session is collected.

**The link doesn't work — what do I do?**
Check that you copied the full link. If the problem persists, contact the survey organiser.

**I passed but wasn't redirected — what do I do?**
Wait a few seconds. If nothing happens, check your browser settings for pop-up or redirect blocking. Contact the survey organiser if the issue continues.
