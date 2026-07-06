import nspell from 'nspell';
import en from 'dictionary-en';

const LINE_WRAP_MARK = '\u0001';



let spell;
function getSpell() {
  if (!spell) spell = nspell(en);
  return spell;
}

function normalizeSpaces(text) {
  return text.replace(/[ \t]{2,}/g, ' ').trim();
}

function resolveLineWraps(text) {
  if (!text.includes(LINE_WRAP_MARK)) return normalizeSpaces(text);
  const spell = getSpell();
  const parts = text.split(LINE_WRAP_MARK);
  let out = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const prevMatch = out.match(/([a-zA-Z]+)$/);
    const nextMatch = parts[i].match(/^([a-zA-Z]+)/);
    if (prevMatch && nextMatch && spell.correct(prevMatch[1] + nextMatch[1])) {
      out += parts[i];
    } else {
      out += ' ' + parts[i];
    }
  }
  return normalizeSpaces(out);
}



export const runtime = 'nodejs';

export async function POST(req) {
  const { paragraphs } = await req.json();
  const resolved = paragraphs.map(text => resolveLineWraps(text)); // sync now, no Promise.all needed
  return Response.json({ paragraphs: resolved });
}
