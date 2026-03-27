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

const log = {
  info: (msg: string, params?: Record<string, string | number>) => {
    const paramStr = params ? " " + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(" ") : "";
    console.log(`[UPLOAD][INFO] ${msg}${paramStr}`);
  },
  warn: (msg: string, params?: Record<string, string | number>) => {
    const paramStr = params ? " " + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(" ") : "";
    console.log(`[UPLOAD][WARN] ${msg}${paramStr}`);
  },
  error: (msg: string, params?: Record<string, string | number>) => {
    const paramStr = params ? " " + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(" ") : "";
    console.log(`[UPLOAD][ERROR] ${msg}${paramStr}`);
  },
  stream: (msg: string, params?: Record<string, string | number>) => {
    const paramStr = params ? " " + Object.entries(params).map(([k, v]) => `${k}=${v}`).join(" ") : "";
    console.log(`[UPLOAD][STREAM] ${msg}${paramStr}`);
  },
};

const EXPECTED_PARSER_ERRORS = [
  "Unexpected end of form",
  "Unexpected end of file",
];

const SENSITIVE_FIELDS = ["token", "password", "email", "phone", "secret", "key"];

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.-]/g, "_").substring(0, 200);
}

export async function processStreamingUpload(
  request: Request,
  userId: string,
  customFolder?: string,
  options?: { maxFileSize?: number }
): Promise<UploadStreamingResult> {
  const contentType = request.headers.get("content-type");

  if (!contentType || !contentType.includes("multipart/form-data")) {
    throw new UploadError("Invalid content type: must be multipart/form-data");
  }

  if (!request.body) {
    throw new UploadError("Request body is empty");
  }

  const fields: Record<string, string> = {};
  let sizeLimitExceeded = false;
  let firstError: Error | null = null;

  const maxFileSize = options?.maxFileSize;
  const folderPath = customFolder || `${UPLOAD_CONFIG.BASE_FOLDER}/${userId}`;
  log.info("started", { folder: folderPath, userId, maxFileSize: maxFileSize || "unlimited" });

  const busboyConfig: { headers: Record<string, string>; limits: Record<string, number> } = {
    headers: { "content-type": contentType },
    limits: {},
  };
  if (maxFileSize) {
    busboyConfig.limits.fileSize = maxFileSize;
  }

  const bb = busboy(busboyConfig);

  request.signal?.addEventListener("abort", () => {
    log.warn("request_aborted");
    firstError = firstError || new UploadError("Client aborted upload", 499);
    bb.destroy();
  });

  bb.on("field", (name, value) => {
    fields[name] = value;
    if (SENSITIVE_FIELDS.some((f) => name.toLowerCase().includes(f))) {
      log.stream("field_received", { name });
    } else {
      log.stream("field_received", { name, value });
    }
  });

  const uploads: Promise<CloudinaryUploadResult>[] = [];

  bb.on("file", (_fieldname, file, info) => {
    const rawFilename = info.filename;
    const safeFilename = sanitizeFilename(rawFilename);
    const { mimeType } = info;
    log.info("file_detected", { name: safeFilename, mime: mimeType });

    if (sizeLimitExceeded) {
      log.warn("file_skipped", { name: safeFilename, reason: "size_limit_exceeded" });
      file.resume();
      return;
    }

    const startTime = Date.now();
    let chunkCount = 0;
    let totalBytes = 0;
    let settled = false;

    const uploadPromise = new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const safeReject = (err: Error) => {
        if (settled) return;
        settled = true;
        if (!firstError) firstError = err;
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
          filename_override: safeFilename,
          use_filename: true,
          unique_filename: false,
        },
        (err, result) => {
          const duration = Date.now() - startTime;

          if (err) {
            log.error("cloudinary_error", { file: safeFilename, reason: err.message });
            safeReject(err);
            return;
          }

          log.info("upload_complete", {
            file: safeFilename,
            chunks: chunkCount,
            total: `${(totalBytes / (1024 * 1024)).toFixed(2)}MB`,
            duration: `${duration}ms`,
          });
          safeResolve(result as CloudinaryUploadResult);
        }
      );

      uploadStream.on("error", (err: Error) => {
        log.error("upload_stream_error", { file: safeFilename, reason: err.message });
        file.unpipe();
        file.resume();
        safeReject(err);
      });

      file.on("data", (chunk: Buffer) => {
        chunkCount++;
        totalBytes += chunk.length;
        const elapsed = Date.now() - startTime;
        log.stream("chunk", {
          file: safeFilename,
          index: chunkCount,
          size: `${chunk.length}B`,
          total: `${totalBytes}B`,
          elapsed: `${elapsed}ms`,
        });
      });

      file.on("limit", () => {
        log.warn("size_limit_exceeded", { file: safeFilename, max: `${maxFileSize}B` });

        sizeLimitExceeded = true;
        settled = true;
        firstError = new UploadError(
          `File ${safeFilename} exceeds ${maxFileSize} byte limit`,
          400
        );

        file.unpipe();
        uploadStream.destroy();
        file.resume();

        reject(firstError);
      });

      file.pipe(uploadStream);
    });

    uploads.push(uploadPromise);
  });

  bb.on("error", (err: Error) => {
    if (firstError) return;

    const isExpected = sizeLimitExceeded && EXPECTED_PARSER_ERRORS.some((e) => err.message.includes(e));

    if (isExpected) {
      log.warn("parser_error_swallowed", { reason: err.message });
      return;
    }

    log.error("parser_error", { reason: err.message });
    firstError = err;
  });

  const nodeStream = Readable.fromWeb(request.body as any);

  try {
    nodeStream.pipe(bb);
  } catch (err: unknown) {
    const error = err as Error;
    const isExpected =
      sizeLimitExceeded &&
      EXPECTED_PARSER_ERRORS.some((e) => error.message?.includes(e));

    if (isExpected) {
      log.warn("pipe_error_swallowed", { reason: error.message });
    } else {
      log.error("pipe_error", { reason: error.message });
      if (!firstError) firstError = error;
    }
  }

  await new Promise<void>((resolve) => {
    bb.on("close", () => {
      log.info("parser_closed");
      resolve();
    });
    bb.on("error", () => resolve());
  });

  log.info("processing_uploads", { count: uploads.length });

  const settledResults = await Promise.allSettled(uploads);

  const failedCount = settledResults.filter((r) => r.status === "rejected").length;
  const successCount = settledResults.filter((r) => r.status === "fulfilled").length;

  log.info("uploads_complete", { success: successCount, failed: failedCount });

  if (firstError) {
    throw firstError;
  }

  const files = settledResults
    .filter((r): r is PromiseFulfilledResult<CloudinaryUploadResult> => r.status === "fulfilled")
    .map((r) => r.value);

  return { files, fields };
}
