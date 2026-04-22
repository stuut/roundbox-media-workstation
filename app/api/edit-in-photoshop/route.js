import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const file = fs.createWriteStream(dest);
    client.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

export async function POST(req) {
  try {
    const { image } = await req.json();

    let filePath;

    const editDir = path.join(process.cwd(), 'public', 'edit-images');
    // Case 1: Local path
    if (image.startsWith('/')) {
      filePath = path.join(process.cwd(), 'public', image);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: 'Local file not found' },
          { status: 404 }
        );
      }else{
          const relativePath = path.relative('./public', filePath)
          const destinationPath = path.join(editDir, path.basename(filePath));
          fs.copyFileSync(filePath, destinationPath)
          // 🔥 IMPORTANT: switch to the copied file
          filePath = destinationPath;
          console.log('Opening in Photoshop:', filePath);
      }
    }

    // Case 2: Remote URL
    else if (image.startsWith('http')) {
      const fileName = `edit-${Date.now()}.png`;
      filePath = path.join(
        process.cwd(),
        'public',
        'edit-images',
        fileName
      );

      await downloadImage(image, filePath);
    }

    else {
      return NextResponse.json(
        { error: 'Invalid image input' },
        { status: 400 }
      );
    }

    // Open in Photoshop
    exec(`open -a "Adobe Photoshop 2026" "${filePath}"`);

    return NextResponse.json({
      success: true,
      publicUrl: filePath.split('/public')[1], // usable in frontend
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
