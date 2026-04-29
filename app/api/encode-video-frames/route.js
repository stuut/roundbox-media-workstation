import { execFile } from "child_process";
import fs from "fs";          // for createReadStream
import fsp from "fs/promises"; // for mkdir, writeFile, rm, etc.
import { nanoid } from "nanoid";
import unzipper from "unzipper"; // npm i unzipper

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const framesZip = formData.get("framesZip");
    if (!framesZip) {
      return new Response(JSON.stringify({ error: "No frames zip provided" }), {
        status: 400,
      });
    }

    const fps = formData.get("fps");

    const id = nanoid();
    const tmpDir = `/tmp/video-${id}`;
    await fsp.mkdir(tmpDir);

    // Write zip to tmp file
    const zipBuffer = Buffer.from(await framesZip.arrayBuffer());
    const zipPath = `${tmpDir}/frames.zip`;
    await fsp.writeFile(zipPath, zipBuffer);

    // Unzip using fs.createReadStream
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tmpDir }))
        .on("close", resolve)
        .on("error", reject);
    });

    // Optional audio
    const audioFile = formData.get("audio");
    let audioPath;
    if (audioFile) {
      audioPath = `${tmpDir}/audio.mp3`;
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      await fs.writeFile(audioPath, audioBuffer);
    }

    const outputPath = `${tmpDir}/output.mp4`;

    // FFmpeg arguments
    const ffmpegArgs = [
      "-framerate",
      fps, // adjust if needed
      "-i",
      `${tmpDir}/frame%04d.jpg`,
    ];

    if (audioPath) ffmpegArgs.push("-i", audioPath);

    ffmpegArgs.push(
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart"
    );

    if (audioPath) ffmpegArgs.push("-shortest");

    ffmpegArgs.push(outputPath);

    // Run ffmpeg
    await new Promise((resolve, reject) => {
      execFile("ffmpeg", ffmpegArgs, (err, stdout, stderr) => {
        if (err) {
          console.error("FFmpeg error:", stderr);
          return reject(err);
        }
        resolve();
      });
    });

    //const outputFile = await fsp.readFile(outputPath);
    const outputFile = fs.createReadStream(outputPath);


    // Cleanup
    await fsp.rm(tmpDir, { recursive: true, force: true });

    return new Response(outputFile, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="animation.mp4"',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Video encoding failed" }),
      { status: 500 }
    );
  }
}
