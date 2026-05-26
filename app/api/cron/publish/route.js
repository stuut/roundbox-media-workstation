import { createClient } from "@supabase/supabase-js"
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function publishToFacebook(job) {


  const pageId = job.platform_account.external_account_id
  const accessToken = job.platform_account.access_token
  const caption = job.caption

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

  const igId = job.platform_account.external_account_id;
  const accessToken = job.platform_account.access_token;
  const caption = job.caption;
  const files = job?.post_files??[]


  if (!files?.length) throw new Error("No media");


  if (files.length > 1) {
    return publishInstagramCarousel({
      igId,
      accessToken,
      caption,
      files
    });
  }

  const file = files[0];
  const { file_id } = file;
  const fileUrl = file_id?.file_url;
  const type = job.type

  const isVideo =
  file.file_id?.file_type?.startsWith("video") ||
  file.file_id?.file_url?.match(/\.(mp4|mov|m4v)$/i);


  if (isVideo) {
    let mediaType = "REELS"
    if (type === 'video') {
      mediaType = "VIDEO"
    }else if (type === 'photo_stories') {
      media_type = "STORIES"
    }
    return publishSingleInstagramMedia({
      igId,
      accessToken,
      caption,
      mediaField: "video_url",
      mediaUrl: fileUrl,
      extraFields: {
        media_type: mediaType,
        share_to_feed: true,
      },
    });
  }

  return publishSingleInstagramMedia({
    igId,
    accessToken,
    caption,
    mediaField: "image_url",
    mediaUrl: fileUrl,
  });

}


/* ==================================================
   CAROUSEL
================================================== */
async function publishInstagramCarousel({
  igId,
  accessToken,
  caption,
  files,
}) {
  if (!files || files.length < 2) {
    throw new Error("Carousel requires at least 2 media files.");
  }

  if (files.length > 10) {
    throw new Error("Instagram carousel max is 10 items.");
  }

  // ------------------------------------------
  // 1. Create child containers
  // ------------------------------------------
  const childIds = [];

  for (const file of files) {
    const url = file.file_id.file_url;

    const isVideo =
      file.file_type === "video/mp4" ||
      url.match(/\.(mp4|mov|m4v)$/i);

    const body = new URLSearchParams({
      is_carousel_item: "true",
      access_token: accessToken,
    });

    if (isVideo) {
      body.append("video_url", url);
      body.append("media_type", "VIDEO");
    } else {
      body.append("image_url", url);
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${igId}/media`,
      {
        method: "POST",
        body,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Failed child container");
    }

    childIds.push(data.id);
  }

  // ------------------------------------------
  // 2. Wait until all child containers finish
  // ------------------------------------------
  for (const id of childIds) {

    await waitForInstagramContainer(id, accessToken);
  }

  // ------------------------------------------
  // 3. Create parent carousel container
  // ------------------------------------------
  const parentBody = new URLSearchParams({
    media_type: "CAROUSEL",
    children: childIds.join(","),
    caption,
    access_token: accessToken,
  });

  const parentRes = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/media`,
    {
      method: "POST",
      body: parentBody,
    }
  );

  const parentData = await parentRes.json();

  if (!parentRes.ok) {
    throw new Error(parentData.error?.message || "Failed parent carousel");
  }

  const creationId = parentData.id;

  // ------------------------------------------
  // 4. Wait until parent is ready
  // ------------------------------------------

  await waitForInstagramContainer(creationId, accessToken);

  // ------------------------------------------
  // 5. Publish carousel
  // ------------------------------------------
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishRes.json();

  if (!publishRes.ok) {
    throw new Error(publishData.error?.message || "Publish failed");
  }

  return {
    id: publishData.id,
    url: `https://instagram.com/p/${publishData.id}`,
  };
}

/* ==================================================
   SINGLE IMAGE / REEL
================================================== */
async function publishSingleInstagramMedia({
  igId,
  accessToken,
  caption,
  mediaField,
  mediaUrl,
  extraFields = {},
}) {
  const body = new URLSearchParams({
    caption,
    access_token: accessToken,
    ...extraFields,
  });

  body.append(mediaField, mediaUrl);

  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/media`,
    {
      method: "POST",
      body,
    }
  );

  const createData = await createRes.json();

  if (!createRes.ok) {

    throw new Error(createData.error?.message || "Create failed");
  }

  await waitForInstagramContainer(createData.id, accessToken);

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${igId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: createData.id,
        access_token: accessToken,
      }),
    }
  );

  const publishData = await publishRes.json();


  if (!publishRes.ok) {
    throw new Error(publishData.error?.message || "Publish failed");
  }

  return {
    id: publishData.id,
    url: `https://instagram.com/p/${publishData.id}`,
  };
}

/* ==================================================
   WAIT FOR CONTAINER
================================================== */
async function waitForInstagramContainer(id, accessToken) {
  const maxAttempts = 25;
  const baseDelay = 5000;
  const maxDelay = 15000;


  const user_token = "EAAoUeGVf64cBRhfMfUvnfmloOPJ5ZC4vaK10SYSMYZBmiH7wAyoB4uHeTpYNJDX1ouK4OuArHNooqmvVsOlGFsb7tZA5A66C5c6Tet3kzbvE7QeNZBUBHcGrQPjHo5bt1KxZAkL68FjLtXljkZBFg6uTScyqTMQG1ZBgPgIxJe9jFASNVMAY001KcAPZAIhpC379RdfTyOuaBwZDZD"

  for (let i = 1; i <= maxAttempts; i++) {
    const res = await fetch(
      `https://graph.facebook.com/v25.0/${id}?fields=status_code&access_token=${user_token}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Status check failed");
    }

    const status = data.status_code;

    if (status === "FINISHED") return;

    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Container failed: ${status}`);
    }

    // 🔽 linear backoff
    const delay = Math.min(baseDelay * i, maxDelay);
    await sleep(delay);
  }

  throw new Error("Timed out waiting for Instagram processing");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updatefacebookPublished(job){

  await supabase
    .from("post_publications")
    .update({
      status: "published",
      published_at: new Date().toISOString()
    })
    .eq("id", job.id)

}


async function updateInstagramPublished(result, job){

  const postId = result.id

  await supabase
    .from("post_publications")
    .update({
      status: "published",
      meta_data: {
        post_id:postId,
        post_data:job.meta_data.post_data,
        ...result
      },
      published_at: new Date().toISOString()
    })
    .eq("id", job.id)
}


export async function GET(request) {



  try {
    // 1. Fetch scheduled publications
    const { data: jobs, error } = await supabase
      .from("post_publications")
      .select(
        `
        id,
        scheduled_at,
        published_at,
        status,
        title,
        caption,
        type,
        last_error,
        meta_data,
        post_files: post_files(
          post_publication_id,
          file_id:files(*)
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

    //return Response.json({ jobs })

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
            await updatefacebookPublished(job)
            break

          case "instagram":
            result = await publishToInstagram(job)
            await updateInstagramPublished(result, job)
            break

          default:
            throw new Error(`Unsupported platform: ${platform}`)
        }


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
