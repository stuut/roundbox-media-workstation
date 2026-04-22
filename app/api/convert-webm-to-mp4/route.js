import { exec, execFile } from 'child_process';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs'; // REQUIRED for ffmpeg / child_process

export async function POST(req) {
  try {
    const buffer = Buffer.from(await req.arrayBuffer());

    const id = nanoid();
    const inputPath = `/tmp/input-${id}.webm`;
    const outputPath = `/tmp/output-${id}.mp4`;

    await fs.writeFile(inputPath, buffer);



    await new Promise((resolve, reject) => {
      execFile('ffmpeg', [
          '-i', inputPath,
          '-c:v', 'libx264',
          '-crf', '18',
          '-preset', 'slow',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-an', outputPath
        ], (err, stdout, stderr) => {
        if (err) {
          console.error('FFmpeg error:', stderr);
          return reject(err);
        }
        resolve();
      });
    });

    const outputFile = await fs.readFile(outputPath);

    await fs.unlink(inputPath);
    await fs.unlink(outputPath);

    return new Response(outputFile, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="converted.mp4"',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'Conversion failed' }),
      { status: 500 }
    );
  }
}
