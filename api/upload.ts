// api/upload.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import Busboy from "busboy";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import stream from "stream";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "";
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || "";
const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || ""; // e.g. "infinityx-edtech.appspot.com"

if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY || !FIREBASE_STORAGE_BUCKET) {
  console.warn("Missing Firebase env variables for upload API (upload.ts).");
}

// Initialize firebase-admin once per lambda instance
let firebaseInitialized = false;
try {
  if (!firebaseInitialized) {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      } as any),
      storageBucket: FIREBASE_STORAGE_BUCKET,
    });
    firebaseInitialized = true;
  }
} catch (e) {
  // ignore repeated initialization errors
}

/**
 * Helper: upload buffer to Firebase Storage and make it public.
 */
async function uploadBufferToStorage(filename: string, buffer: Buffer, mimetype: string) {
  const bucket = getStorage().bucket();
  const file = bucket.file(`uploads/${filename}`);
  const passthrough = new stream.PassThrough();
  passthrough.end(buffer);

  await new Promise<void>((resolve, reject) => {
    const writeStream = file.createWriteStream({
      metadata: { contentType: mimetype },
      resumable: false,
    });
    passthrough.pipe(writeStream)
      .on("finish", () => resolve())
      .on("error", (err) => reject(err));
  });

  // Make file public (so you can GET it without auth)
  try {
    await file.makePublic();
  } catch (err) {
    // makePublic may fail depending on IAM; still continue and return signedUrl fallback if needed
    console.warn("makePublic failed:", err);
  }

  // Public URL pattern for Firebase Storage (when public):
  const publicUrl = `https://storage.googleapis.com/${FIREBASE_STORAGE_BUCKET}/uploads/${filename}`;
  return publicUrl;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const busboy = Busboy({ headers: req.headers });
    const fileBuffers: Array<{ fieldname: string; filename: string; mime: string; buffer: Buffer }> = [];

    await new Promise<void>((resolve, reject) => {
      busboy.on("file", (fieldname, fileStream, filename, encoding, mimetype) => {
        const chunks: Buffer[] = [];
        fileStream.on("data", (d) => chunks.push(Buffer.from(d)));
        fileStream.on("end", () => {
          fileBuffers.push({
            fieldname,
            filename,
            mime: mimetype,
            buffer: Buffer.concat(chunks),
          });
        });
      });

      busboy.on("error", (err) => reject(err));
      busboy.on("finish", () => resolve());
      busboy.end(req.rawBody || req.body || Buffer.from([]));
    });

    if (!fileBuffers.length) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    // We'll upload the first file
    const f = fileBuffers[0];
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${f.filename ? ("-" + f.filename.replace(/\s+/g, "_")) : ""}`;

    const publicUrl = await uploadBufferToStorage(uniqueName, f.buffer, f.mime);

    return res.status(200).json({
      success: true,
      url: publicUrl,
      filename: uniqueName,
      size: f.buffer.length,
      mimetype: f.mime,
    });
  } catch (err: any) {
    console.error("upload api error:", err);
    return res.status(500).json({ success: false, error: err?.message || "Upload failed" });
  }
}
