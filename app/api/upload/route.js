import { NextResponse } from 'next/server'
import { r2Client } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

//Cloudflare R2

export async function POST(req) {
  const formData = await req.formData()
  const file = formData.get('file')
  const tag = formData.get('tag')
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  let fileName = `${Date.now()}-${file.name}`
  if (tag){
    fileName = fileName+tag
  }

  console.log('fileName ', fileName )

  const command = new PutObjectCommand({
    Bucket: process.env.R2_PUBLIC_BUCKET,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read', // optional
  })

  try {
    await r2Client.send(command)

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`

    return NextResponse.json({ url: fileUrl })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
