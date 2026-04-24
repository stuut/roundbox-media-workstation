import { createClient } from "@supabase/supabase-js"
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function publishToFacebook(job) {


  const pageId = job.platform_account.external_account_id
  const accessToken = job.platform_account.access_token
  const caption = job.post.caption

  const res = await fetch(`https://graph.facebook.com/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: caption,
      access_token: accessToken
    })
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message || "Facebook publish failed")
  }

  return {
    id: data.id,
    url: `https://facebook.com/${data.id}`
  }
}



async function publishToInstagram(job) {
  const igId = job.platform_account.external_account_id
  const accessToken = job.platform_account.access_token
  const caption = job.post.caption
  const files = job.post.post_files
  const file_url = job.post.post_files[0].file_id.file_url

  let body

  if (job.post.type === 'video_reels'){
    body = new URLSearchParams({
      caption : caption,
      video_url: file_url,
      media_type:'VIDEO',
      share_to_feed : true,           // Optional, if you also want it in the feed
      is_reel: true,
      access_token: accessToken
    })

  }else{
    body = new URLSearchParams({
      caption : caption,
      image_url: file_url,
      access_token: accessToken
    })
  }

  // 1. Create media container
  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/media`,
    {
      method: "POST",
      body: body
    }
  )

  const createData = await createRes.json()

  if (!createRes.ok) {
    throw new Error(createData.error?.message)
  }

  // 2. Publish container
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: createData.id,
        access_token: accessToken
      })
    }
  )

  const publishData = await publishRes.json()

  if (!publishRes.ok) {
    throw new Error(publishData.error?.message)
  }

  return {
    id: publishData.id,
    url: `https://instagram.com/p/${publishData.id}`
  }
}


export async function GET(req) {



  try {
    // 1. Fetch scheduled publications
    const { data: jobs, error } = await supabase
      .from("post_publications")
      .select(
        `
        id,
        scheduled_at,
        status,
        post:posts (
          id,
          caption,
          post_files: post_files(
            post_id,
            file_id:files(*)
          )
        ),
        platform_account:platform_accounts (
          id,
          platform,
          access_token,
          external_account_id,
          metadata
        )
      `
      )
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString())
      .limit(10) // batch size

    if (error) throw error

    if (!jobs || jobs.length === 0) {
      return Response.json({ message: "No jobs to process" })
    }

    // 2. Process jobs
    for (const job of jobs) {
      try {
        // mark as processing (avoid double execution)
        await supabase
          .from("post_publications")
          .update({ status: "processing" })
          .eq("id", job.id)

        const platform = job.platform_account.platform

        let result

        switch (platform) {
          case "facebook":
            result = await publishToFacebook(job)
            break

          case "instagram":
            result = await publishToInstagram(job)
            break

          default:
            throw new Error(`Unsupported platform: ${platform}`)
        }

        // success update
        await supabase
          .from("post_publications")
          .update({
            status: "published",
            meta_data: result,
            published_at: new Date().toISOString()
          })
          .eq("id", job.id)
      } catch (err) {
        console.error("Publish error:", err.message)

        await supabase
          .from("post_publications")
          .update({
            status: "failed",
            last_error: err.message
          })
          .eq("id", job.id)
      }
    }

    return Response.json({ message: `Processed ${jobs.length} jobs` })
  } catch (err) {
    console.error(err)
    return new Response("Cron failed", { status: 500 })
  }
}
