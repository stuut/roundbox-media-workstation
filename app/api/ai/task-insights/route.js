// backend/api/ai/task-insights.js

import { Configuration, OpenAIApi } from 'openai';
import chrono from 'chrono-node';
import { supabaseAdmin } from '@/utils/supabase/superbaseAdmin.js';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * POST /api/ai/task-insights
 * Expects: { title, description, fields: [{ id, name, type, options? }] }
 * Returns suggestions for default + custom fields
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, description, fields = [], userId } = req.body;
  const input = `${title}\n${description}`;
  const dueDate = chrono.parseDate(input);

  // 1. Fetch up to 5 most recent tasks (you can filter by board/user if needed)
  const { data: historyTasks = [] } = await supabaseAdmin
    .from('tasks')
    .select('id, title, description, task_column_values(column_id, value_text, value_select_option_id)')
    .order('created_at', { ascending: false })
    .limit(5);

  // 2. Format previous tasks for context (loosely, since columns are dynamic)
  const pastTaskSummaries = historyTasks.map((task, i) => {
    const short = task.title || 'Untitled';
    const summary = task.task_column_values.map(v => {
      return `${v.column_id}: ${v.value_text || v.value_select_option_id || ''}`;
    }).join(', ');
    return `${i + 1}. ${short}${summary ? ` — ${summary}` : ''}`;
  }).join('\n');

  // 3. Construct the GPT prompt
  const prompt = `You are helping fill out a task form based on previous tasks.\n\nPast tasks:\n${pastTaskSummaries}\n\nNow suggest field values for this task:\nTitle: ${title}\nDescription: ${description}\n\nFields to suggest:\n${fields.map(f => f.name).join(', ')}\n\nReturn a JSON object with keys matching the field names and values based on your suggestion.`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    let suggestions = {};
    try {
      suggestions = JSON.parse(completion.data.choices[0].message.content);
    } catch (err) {
      console.warn('Failed to parse GPT output');
    }

    res.status(200).json({
      due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
      ...suggestions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI suggestion failed' });
  }
}
