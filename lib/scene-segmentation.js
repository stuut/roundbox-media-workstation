function splitIntoScenes(text) {
  const paragraphs = text.split(/\n\s*\n/);
  const scenes = [];

  paragraphs.forEach(p => {
    const trimmed = p.trim();
    if (!trimmed) return;

    // Detect heading (simple heuristic)
    const isHeading =
      trimmed.length < 80 &&
      (trimmed === trimmed.toUpperCase() || trimmed.startsWith("#"));

    if (isHeading) {
      scenes.push({ type: "heading", text: trimmed });
    } else {
      // Split into sentences
      const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];

      let chunk = "";

      sentences.forEach(sentence => {
        const words = (chunk + sentence).split(/\s+/).length;

        if (words > 20) {
          scenes.push({ type: "body", text: chunk.trim() });
          chunk = sentence;
        } else {
          chunk += " " + sentence;
        }
      });

      if (chunk.trim()) {
        scenes.push({ type: "body", text: chunk.trim() });
      }
    }
  });

  return scenes;
}

export function getSceneDuration(scene) {
  const words = scene.text.split(/\s+/).length;

  if (scene.type === "heading") {
    return Math.min(3, Math.max(1.5, words * 0.3));
  }

  // body text
  const wpm = 170;
  const base = (words / wpm) * 60;

  // punctuation pauses
  const pauses =
    (scene.text.match(/,/g) || []).length * 0.3 +
    (scene.text.match(/[.!?]/g) || []).length * 0.6;

    const seconds = Math.max(2, base + pauses + 0.5);


  return Math.ceil(seconds)
}

export function buildScenesWithTiming(scenes) {
  //const scenes = splitIntoScenes(text);

  return scenes.map(scene => ({
    ...scene,
    duration: getSceneDuration(scene)
  }));
}

export function preprocessScenes(text) {
  // Split on newlines, remove "**Scene X:**" prefix
  const lines = text.split(/\n+/).map(line => {
    // Remove leading "**Scene N:** " if it exists
    return line.replace(/^\*\*Scene \d+:?\*\*\s*/, '').trim();
  }).filter(line => line.length > 0); // remove empty lines

  return lines.join('\n\n'); // join with double newlines for your splitter
}
