import { NextResponse } from 'next/server'
//import { r2Client } from '@/lib/r2'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

//Cloudflare R2

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  const formData = await req.formData()
  const file = formData.get('file')
  const tag = formData.get('tag')
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const safeName = file.name
  .normalize('NFKD')
  .replace(/[^\w.-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

  console.log('safeName', safeName)

  let fileName = `${Date.now()}-${safeName}`
  if (tag) {
    fileName += `-${tag}`;
  }

  console.log('fileName upload', fileName)


  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
    //ACL: 'public-read', // optional
  })

  try {
    await s3.send(command)

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(fileName)}`

    return NextResponse.json({ url: fileUrl })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
