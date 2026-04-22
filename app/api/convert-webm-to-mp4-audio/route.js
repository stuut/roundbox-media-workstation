import { exec, execFile } from 'child_process';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs'; // REQUIRED for ffmpeg / child_process

export async function POST(req) {
  try {

    const formData = await req.formData();
    const videoFile = formData.get("video");
    const audioFile = formData.get("audio");

    if (!videoFile) {
      return NextResponse.json(
        { message: "No video file provided" },
        { status: 400 }
      );
    }

    const videobuffer = Buffer.from(await videoFile.arrayBuffer());

    // Write video temp file
    const id = nanoid();
    const inputVideoPath = `/tmp/input-${id}.webm`;
    const outputPath = `/tmp/output-${id}.mp4`;
    await fs.writeFile(inputVideoPath, videobuffer);

    let ffmpegArgs;

    if (audioFile) {
        const audiobuffer = Buffer.from(await audioFile.arrayBuffer());
        const inputAudioPath = `/tmp/audio-${id}.mp3`; // or whatever format it is
        await fs.writeFile(inputAudioPath, audiobuffer);

        // FFmpeg command to merge audio + video
        ffmpegArgs = [
          '-i', inputVideoPath,
          '-i', inputAudioPath,
          '-c:v', 'libx264',
          '-crf', '18',
          '-preset', 'slow',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart',
          '-shortest', // stop encoding at end of shortest stream
          outputPath
        ];
      } else {
        // No audio provided, same as before
        ffmpegArgs = [
          '-i', inputVideoPath,
          '-c:v', 'libx264',
          '-crf', '18',
          '-preset', 'slow',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          outputPath
        ];
      }

      await new Promise((resolve, reject) => {
        execFile('ffmpeg', ffmpegArgs, (err, stdout, stderr) => {
          if (err) {
            console.error('FFmpeg error:', stderr);
            return reject(err);
          }
          resolve();
        });
      });

    const outputFile = await fs.readFile(outputPath);

    // Clean up temp files
        await fs.unlink(inputVideoPath);
        if (audioFile) {
          await fs.unlink(`/tmp/audio-${id}.mp3`);
        }
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
