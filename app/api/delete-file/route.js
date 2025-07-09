import { NextResponse } from 'next/server'
import { r2Client } from '@/lib/r2'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

//Cloudflare R2

export async function DELETE(req) {

  try {
   const body = await req.json()
   const { key } = body

   if (!key) {
     return NextResponse.json({ error: 'Missing file key' }, { status: 400 })
   }

   const command = new DeleteObjectCommand({
     Bucket: process.env.R2_PUBLIC_BUCKET,
     Key: key,
   })


   await r2Client.send(command)

   return NextResponse.json({ message: `Deleted: ${key}` }, { status: 200 })
 } catch (err) {
   console.error('R2 delete error:', err)
   return NextResponse.json(
     { error: 'Failed to delete file', details: err.message },
     { status: 500 }
   )
 }
}
