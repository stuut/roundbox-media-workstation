import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';

function getExtensionFromContentType(contentType = "") {
  if (contentType.includes("image/png")) return "png";
  if (contentType.includes("image/jpeg")) return "jpg";
  if (contentType.includes("image/jpg")) return "jpg";
  if (contentType.includes("image/webp")) return "webp";
  if (contentType.includes("image/gif")) return "gif";
  return "bin"; // fallback
}

export function downloadImage(url, destBase) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (response) => {
        const contentType = response.headers["content-type"];
        const ext = getExtensionFromContentType(contentType);

        const filePath = `${destBase}.${ext}`;
        const file = fs.createWriteStream(filePath);

        response.pipe(file);

        file.on("finish", () => {
          file.close(() => resolve(filePath));
        });

        file.on("error", (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      })
      .on("error", reject);
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
      const basePath = path.join(
        process.cwd(),
        "public",
        "edit-images",
        `edit-${Date.now()}`
      );

      filePath = await downloadImage(image, basePath);
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
