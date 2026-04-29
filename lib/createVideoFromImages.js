
import { getFFmpeg } from '@/lib/ffmpeg'

export async function createVideoFromImages(
  imageFiles,
  audioFile = null,
  fps = 30,
  onProgress
) {
  const ffmpeg = await getFFmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    console.log('progress', progress)
    if (onProgress) {
      onProgress(Math.round(progress * 100))
    }
  })

  // Clean old output if exists
  try { await ffmpeg.deleteFile('output.mp4') } catch {}

  // Sort files by filename
  const sorted = imageFiles.map((img, i) => ({
    blob: img,
    index: i
  }))


  // Write frames
  for (const item of sorted) {
    const buffer = await item.blob.arrayBuffer()

    const name = `frame${String(item.index + 1).padStart(4, '0')}.jpg`

    await ffmpeg.writeFile(name, new Uint8Array(buffer))
  }

  // Optional audio
  if (audioFile) {
    const audioData = new Uint8Array(await audioFile.arrayBuffer())
    await ffmpeg.writeFile('audio.mp3', audioData)
  }

  const args = [
    '-framerate', String(fps),
    '-i', 'frame%04d.jpg'
  ]

  if (audioFile) {
    args.push('-i', 'audio.mp3')
  }

  args.push(
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'veryfast',
    '-crf', '23',
    '-movflags', '+faststart'
  )

  if (audioFile) {
    args.push(
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest'
    )
  }

  args.push('output.mp4')

  await ffmpeg.exec(args)

  const data = await ffmpeg.readFile('output.mp4')

  return new Blob([data.buffer], {
    type: 'video/mp4'
  })
}
