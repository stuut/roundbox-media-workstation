import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb"
    }
  }
}


export async function POST(request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get("videoBlob");
    const channelId = formData.get("channelId");
    const fileUrl = formData.get("fileUrl");

    const { data: channel, error } = await supabase
    .from("platform_accounts")
    .select(`*`)
    .eq("id", channelId)

    if (error) throw error

    if (!channel) {
      return Response.json({ message: "No Social Channel found" },{ status: 500 })
    }

    const accessToken = channel[0]?.access_token
    const socialId = channel[0]?.external_account_id


  /*
    if (!videoFile || !fileUrl) {
      return NextResponse.json(
        { message: "No video file provided" },
        { status: 400 }
      );
    }
    */


    var actualFileSize
    var uploadUrl
    var videoId
    var buffer

    if (videoFile){
      buffer = Buffer.from(await videoFile.arrayBuffer());
      actualFileSize = buffer.length;
    }

    // 👉 now upload buffer with axios

    const initiateUploadResponse = await axios.post(
          `https://graph.facebook.com/v24.0/${socialId}/video_reels`,
          {
            upload_phase: 'start',
            access_token: accessToken,
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

  uploadUrl = initiateUploadResponse.data.upload_url;
  videoId = initiateUploadResponse.data.video_id;


  // Prepare headers and binary upload

  if (!fileUrl){
    const headers = {
      'Authorization': `OAuth ${accessToken}`,
      'offset': '0', // Start offset
      'file_size': actualFileSize.toString(),
      'Content-Length': actualFileSize.toString(), // Set Content-Length header
      //'Content-Type': 'application/x-www-form-urlencoded'
    };
    const response = await axios.post(uploadUrl, buffer, {
        headers: {
          ...headers,
        },
        maxContentLength: Infinity,  // Make sure the upload can handle large files
        maxBodyLength: Infinity,
      });

    return NextResponse.json({data:response.data, videoId:videoId}, {status: 200});

  }else{

    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const urlBuffer = Buffer.from(arrayBuffer);

    const fileSize = urlBuffer.length;


    const headers = {
      'Authorization': `OAuth ${accessToken}`,
      'offset': '0', // Start offset
      'file_size': fileSize.toString(),
      'Content-Length': fileSize.toString(), // Set Content-Length header
      //'Content-Type': 'application/x-www-form-urlencoded'
    };


    const response = await axios.post(uploadUrl, urlBuffer, {
        headers: {
          ...headers,
        },
        maxContentLength: Infinity,  // Make sure the upload can handle large files
        maxBodyLength: Infinity,
      });





    if (!response.ok) {
      console.log(response)
    }


    return NextResponse.json({data:response.data, videoId:videoId}, {status: 200});

  }


  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "Upload failed", error: error.message },
      { status: 500 }
    );
  }
}
