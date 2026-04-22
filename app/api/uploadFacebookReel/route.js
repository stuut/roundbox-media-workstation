import { NextResponse } from 'next/server';
import axios from 'axios';

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
    const accessToken = formData.get("accessToken");
    const socialId = formData.get("socialId");

    if (!videoFile) {
      return NextResponse.json(
        { message: "No video file provided" },
        { status: 400 }
      );
    }

    // Convert blob → buffer
    const buffer = Buffer.from(await videoFile.arrayBuffer());

    const actualFileSize = buffer.length;

    var uploadUrl
    var videoId

    // 👉 now upload buffer with axios
    console.log("File size:", actualFileSize);

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

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Upload failed", error: error.message },
      { status: 500 }
    );
  }
}
