import busboy from "busboy";
import cloudinary from "@/src/lib/cloudinary";
import { Readable } from "stream";

export class UploadError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = "UploadError";
  }
}

const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 6 * 1024 * 1024,
  BASE_FOLDER: "finland/users",
} as const;

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  bytes: number;
  original_filename: string;
  resource_type: string;
}

export interface UploadStreamingResult {
  files: CloudinaryUploadResult[];
  fields: Record<string, string>;
}

export async function processStreamingUpload(
  request: Request,
  userId: string,
  customFolder?: string
): Promise<UploadStreamingResult> {
  const contentType = request.headers.get("content-type");

  if (!contentType || !contentType.includes("multipart/form-data")) {
    throw new UploadError("Invalid content type: must be multipart/form-data");
  }

  if (!request.body) {
    throw new UploadError("Request body is empty");
  }

  const fields: Record<string, string> = {};
  const uploads: Promise<CloudinaryUploadResult>[] = [];
  let aborted = false;

  const bb = busboy({
    headers: { "content-type": contentType },
    limits: {
      fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
    },
  });

  request.signal?.addEventListener("abort", () => {
    console.log("[Request Abort] Upload cancelled by client");
    aborted = true;
    bb.destroy();
  });

  bb.on("field", (name, value) => {
    console.log(`[Busboy] Field: ${name}=${value}`);
    fields[name] = value;
  });

  bb.on("file", (_fieldname, file, info) => {
    const { filename, mimeType } = info;

    console.log(`[Busboy] File detected: ${filename}, mimeType=${mimeType}`);

    if (aborted) {
      file.resume();
      return;
    }

    if (!fields.target_type && !customFolder) {
      console.warn(`[Warning] target_type not ready before file ${filename}`);
    }

    const folderPath =
      customFolder ||
      `${UPLOAD_CONFIG.BASE_FOLDER}/${userId}/${fields.target_type || "general"}`;

    const startTime = Date.now();
    let chunkCount = 0;
    let totalBytes = 0;
    let settled = false;

    const uploadPromise = new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const safeReject = (err: Error) => {
        if (settled) return;
        settled = true;
        aborted = true;
        reject(err);
      };

      const safeResolve = (result: CloudinaryUploadResult) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: "auto",
          filename_override: filename,
          use_filename: true,
          unique_filename: false,
        },
        (err, result) => {
          const duration = Date.now() - startTime;

          if (err) {
            console.log(`[Cloudinary Error] ${filename}: ${err.message}`);
            return safeReject(err);
          }

          console.log(
            `[Upload Complete] ${filename} | chunks=${chunkCount} | total=${(
              totalBytes /
              (1024 * 1024)
            ).toFixed(2)}MB | duration=${duration}ms`
          );

          safeResolve(result as CloudinaryUploadResult);
        }
      );

      uploadStream.on("error", (err: Error) => {
        console.log(`[UploadStream Error] ${filename}: ${err.message}`);
        file.unpipe(uploadStream);
        file.resume();
        uploadStream.destroy();
        safeReject(err);
      });

      file.on("data", (chunk: Buffer) => {
        chunkCount++;
        totalBytes += chunk.length;

        const elapsed = Date.now() - startTime;
        const speedKBps =
          elapsed > 0 ? Math.round((totalBytes / 1024 / elapsed) * 1000) : 0;

        console.log(
          `[Chunk] ${filename} | #${chunkCount} | size=${chunk.length}B | total=${totalBytes}B | t=${elapsed}ms | speed=${speedKBps}KB/s`
        );
      });

      file.on("limit", () => {
        console.log(`[File Limit] ${filename} exceeded size limit`);

        file.unpipe(uploadStream);
        uploadStream.destroy();
        file.resume();

        safeReject(
          new UploadError(
            `File ${filename} exceeds ${UPLOAD_CONFIG.MAX_FILE_SIZE} bytes`
          )
        );
      });

      file.pipe(uploadStream);
    });

    uploads.push(uploadPromise);
  });

  const nodeStream = Readable.fromWeb(request.body as any);

  await new Promise<void>((resolve, reject) => {
    bb.on("finish", () => {
      console.log("[Busboy] Parsing complete");
      resolve();
    });

    bb.on("error", (err: Error) => {
      console.log(`[Busboy Error] ${err.message}`);
      aborted = true;
      reject(err);
    });

    nodeStream.pipe(bb);
  });

  const results = await Promise.all(uploads);

  console.log(`[All Uploads Complete] files=${results.length}`);

  return {
    files: results,
    fields,
  };
}