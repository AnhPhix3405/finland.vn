import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { verifyToken } from "@/src/app/modules/auth/jwt";
import { processStreamingUpload, UploadError } from "@/src/lib/api/upload-stream";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return { valid: false, error: 'Vui lòng đăng nhập', status: 401 };
    }
    
    try {
        const payload = await verifyToken(token);
        if (!payload || !(payload as Record<string, unknown>).id) {
            return { valid: false, error: 'Token không hợp lệ', status: 401 };
        }
        
        const userId = (payload as Record<string, unknown>).id as string;
        const role = (payload as Record<string, unknown>).role as string;

        return { valid: true, userId, role };
    } catch (error) {
        return { valid: false, error: 'Token không hợp lệ', status: 401 };
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request);
        if (!auth.valid) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const isAdmin = auth.role === "admin";
        const maxFileSize = isAdmin ? undefined : 6 * 1024 * 1024;
        const customFolder = isAdmin ? "finland/admin" : undefined;
        
        const { files, fields } = await processStreamingUpload(request, auth.userId!, customFolder, { maxFileSize });

        const target_id = fields.target_id;
        const target_type = fields.target_type || 'admin';
        const sort_order = fields.sort_order ? parseInt(fields.sort_order) : 0;

        const attachmentsData = files.map((file, index) => ({
            url: file.url,
            secure_url: file.secure_url,
            size_bytes: file.bytes ? BigInt(file.bytes) : null,
            original_name: file.original_filename,
            public_id: file.public_id,
            target_id: target_id || auth.userId,
            target_type: target_type,
            sort_order: sort_order + index
        }));

        const createdAttachments = await Promise.all(
            attachmentsData.map(data => prisma.attachments.create({ data }))
        );

        const serialized = createdAttachments.map(item => ({
            ...item,
            size_bytes: item.size_bytes?.toString() || null
        }));

        return NextResponse.json({
            success: true,
            message: "Upload and record creation successful",
            data: serialized
        });

    } catch (error) {
        console.error("[Upload] Error:", error);
        if (error instanceof UploadError) {
            return NextResponse.json({ success: false, error: error.message }, { status: error.status });
        }
        return NextResponse.json({ success: false, error: 'Internal Server Error during upload' }, { status: 500 });
    }
}
