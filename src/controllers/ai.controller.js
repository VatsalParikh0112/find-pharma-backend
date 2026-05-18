const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT =
  'You are a helpful pharmacy assistant for Find Pharma. When a user asks about a medicine or symptom, provide: ' +
  '1) What the medicine/treatment is used for, 2) Common brand names available in India, ' +
  '3) Typical dosage (general guidance only — not a prescription), ' +
  '4) Important warnings or side effects to be aware of. ' +
  'Always remind the user to consult a licensed pharmacist or doctor before taking any medication. ' +
  'Keep responses concise and easy to understand.';

const searchMedicine = async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'query is required' });
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await model.generateContentStream(query.trim());

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('AI controller error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'AI service unavailable' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI service error' })}\n\n`);
      res.end();
    }
  }
};

module.exports = { searchMedicine };
