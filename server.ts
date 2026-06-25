import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';
import { HfInference } from '@huggingface/inference';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Search / Scrape Route (Acts as Teacher)
  app.post('/api/chat', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // 1. Check if the prompt contains a URL for scraping
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = prompt.match(urlRegex);

      if (urls && urls.length > 0) {
        const targetUrl = urls[0];
        try {
          const scrapeRes = await fetch(targetUrl, {
            headers: { 'User-Agent': 'SWEI-App/1.0 (https://ais-dev.run.app)' }
          });
          
          if (!scrapeRes.ok) {
             return res.json({ text: `Failed to scrape ${targetUrl}: HTTP status ${scrapeRes.status}` });
          }
          
          const html = await scrapeRes.text();
          const $ = cheerio.load(html);
          
          // Remove noisy elements
          $('script, style, noscript, iframe, img, svg, video, header, footer, nav').remove();
          
          // Extract text and clean it
          const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1500);
          
          const responseText = `Here is the data I extracted from ${targetUrl}:\n\n${textContent}...\n\n(Source: Web Scraper Tool)`;
          return res.json({ text: responseText });
        } catch (error: any) {
          console.error('Scraping error:', error);
          return res.json({ text: `Failed to scrape ${targetUrl}: ${error.message}` });
        }
      }

      // 2. Fallback to Hugging Face Inference API if configured, otherwise use Wikipedia
      const hfKey = process.env.HUGGINGFACE_API_KEY;
      if (hfKey) {
        try {
          const hf = new HfInference(hfKey);
          const response = await hf.chatCompletion({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            messages: [
              { role: "system", content: "You are the 'Teacher' module of the S.W.E.I. system. Explain conceptually how to solve the user's prompt, the reasoning behind it, and the knowledge required. Do not just output an answer, output the thought process and data so that the S.W.E.I Learner module can observe and extract JSON from it." },
              { role: "user", content: prompt }
            ],
            max_tokens: 800,
          });

          return res.json({ text: response.choices[0].message.content });
        } catch (hfError: any) {
          console.error('Hugging Face Inference failed, falling back to Wikipedia:', hfError.message);
          // Don't return, let it fall through to Wikipedia
        }
      }

      // 3. Fallback to Wikipedia API
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(prompt)}&utf8=&format=json`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'SWEI-App/1.0 (https://ais-dev.run.app)' }
      });
      const searchData = await searchRes.json();

      if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
        const topResult = searchData.query.search[0];
        
        // Fetch the extract for the top result
        const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(topResult.title)}&format=json`;
        const extractRes = await fetch(extractUrl, {
          headers: { 'User-Agent': 'SWEI-App/1.0 (https://ais-dev.run.app)' }
        });
        const extractData = await extractRes.json();
        
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const content = pages[pageId].extract;

        const responseText = `Here is what I found on Wikipedia about "${prompt}":\n\n${content}\n\n(Source: Wikipedia - ${topResult.title})`;
        res.json({ text: responseText });
      } else {
        res.json({ text: `I couldn't find any specific information about "${prompt}" in my database. Could you try rephrasing or asking something else?` });
      }
    } catch (error: any) {
      console.error('Error fetching from Teacher route:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch information' });
    }
  });

  // Local S.W.E.I Learner Extraction Route
  app.post('/api/extract', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text to extract is required' });
      }

      const hfKey = process.env.HUGGINGFACE_API_KEY;
      if (hfKey) {
        try {
          const hf = new HfInference(hfKey);
          
          const systemInstruction = `You are the "Learner" module (S.W.E.I) observing a teacher's response.
Your job is to extract knowledge, skills, and parameter structures from the teacher's explanation.
Return the result strictly as a valid JSON object with the following schema:
{
  "observation_id": "string (generate a unique id)",
  "extracted_intents": ["string"],
  "extracted_entities": ["string"],
  "parameter_weights": { "confidence": number, "priority": number },
  "key_learnings": ["string"],
  "proposed_rule_format": { "triggers": ["string"], "response_summary": "string" }
}
Do NOT wrap the output in markdown code blocks. Output ONLY raw JSON.`;

          const response = await hf.chatCompletion({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: text }
            ],
            max_tokens: 500,
          });

          const rawContent = response.choices[0].message.content || "";
          // Clean up markdown wrapping if the model ignored the instruction
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          const jsonContent = jsonMatch ? jsonMatch[0] : rawContent;

          try {
            // Verify it's parseable JSON
            const parsed = JSON.parse(jsonContent);
            return res.json({ data: parsed });
          } catch (e) {
            return res.json({ data: jsonContent });
          }
        } catch (hfError: any) {
          console.error('Hugging Face Extraction failed, falling back to simulated extraction:', hfError.message);
        }
      }

      // Simulated local extraction (since Hugging Face API is unavailable)
      const words = text.split(/\s+/);
      const topWords = words.filter((w: string) => w.length > 5).slice(0, 5);

      const simulatedExtraction = {
        observation_id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        extracted_intents: ["knowledge_acquisition", "concept_analysis"],
        extracted_entities: topWords,
        parameter_weights: { 
          confidence: parseFloat((0.7 + Math.random() * 0.25).toFixed(2)), 
          priority: Math.floor(60 + Math.random() * 30) 
        },
        key_learnings: [
          `Information gathered regarding ${topWords[0] || 'the topic'}.`,
          `Observed structural pattern in the response.`
        ],
        proposed_rule_format: { 
          triggers: [topWords[0] || "topic", topWords[1] || "concept"], 
          response_summary: text.substring(0, 50) + "..." 
        }
      };

      res.json({ data: simulatedExtraction });
    } catch (error: any) {
      console.error('Error in Learner extraction:', error);
      res.status(500).json({ error: error.message || 'Failed to extract data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
