import { NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'



//Cloudflare S3

export async function DELETE(req) {

  try {
   const body = await req.json()
   const { key } = body

   if (!key) {
     return NextResponse.json({ error: 'Missing file key' }, { status: 400 })
   }

   const s3 = new S3Client({
     region: process.env.AWS_REGION,
     credentials: {
       accessKeyId: process.env.AWS_ACCESS_KEY_ID,
       secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
     },
   });

   const command = new DeleteObjectCommand({
     Bucket: process.env.AWS_S3_BUCKET,
     Key: key,
   })


   await s3.send(command)

   return NextResponse.json({ message: `Deleted: ${key}` }, { status: 200 })
 } catch (err) {
   console.error('R2 delete error:', err)
   return NextResponse.json(
     { error: 'Failed to delete file', details: err.message },
     { status: 500 }
   )
 }
}
