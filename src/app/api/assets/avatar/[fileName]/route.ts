import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const allowedAvatarFiles = new Set([
  "a1.png",
  "a2.png",
  "a3.png",
  "a4.png",
  "a5.png",
  "a6.png",
  "a7.png",
  "a8.png",
  "a9.png",
  "a10.png",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const fileName = (await params).fileName;

  if (!allowedAvatarFiles.has(fileName)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "Account-avatar", fileName);
  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
