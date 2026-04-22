import { NextResponse } from 'next/server';
import fs from 'fs';




export async function POST(req) {
  try {

    let localFiles

    fs.readdir('./public/edit-images', (err, files) => {
      if (err) throw err;
      localFiles = files
    });


    return NextResponse.json({
      files: localFiles, // usable in frontend
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
