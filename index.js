require('dotenv').config();
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');
const db = require('./db/db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.error('GROQ_API_KEY environment variable is required');
  process.exit(1);
}
const groq = new Groq({ apiKey: groqApiKey });

app.get('/api/agents', async (req, res) => {
  try {
    const agents = await db.getAllAgents();
    res.json(agents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const agents = await db.getAllAgents();
    const agentsInfo = agents.map(a => `${a.name}: ${a.great}`).join('\n');

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an AI tool recommendation expert. Given a user's needs, recommend the most suitable AI tool from the list below.

Available AI tools:
${agentsInfo}

Respond in JSON format only:
{
  "name": "AI tool name (in Korean)",
  "reason": "Why this tool is recommended (in Korean)",
  "tip": "Usage tip for this tool (in Korean)"
}`
        },
        { role: 'user', content: query }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/admin/ai', async (req, res) => {
  try {
    const { name, great } = req.body;
    if (!name || !great) return res.status(400).json({ error: 'name and great are required' });

    await db.addAgent(name, great);
    res.status(201).json({ message: 'AI tool added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/v1/admin/ai/:name', async (req, res) => {
  try {
    await db.deleteAgent(req.params.name);
    res.json({ message: 'AI tool deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await db.initDB();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  db.seedDB().catch(console.error);
}

start();
