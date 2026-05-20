import { NextResponse, type NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // 获取 Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Authentication required'),
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    const supabase = createServiceClient();

    // 验证 JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('AUTH_REQUIRED', 'Invalid or expired token'),
        { status: 401 }
      );
    }

    // 解析 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'No file uploaded'),
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'),
        { status: 400 }
      );
    }

    // 验证文件大小（最大 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        createErrorResponse('INVALID_PARAMS', 'File size exceeds 10MB limit'),
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${user.id}/${timestamp}-${randomStr}.${fileExt}`;

    // 上传到 Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        createErrorResponse('UPLOAD_FAILED', 'Failed to upload file'),
        { status: 500 }
      );
    }

    // 获取公开 URL
    const { data: urlData } = supabase.storage
      .from('generated')
      .getPublicUrl(fileName);

    return NextResponse.json(
      createSuccessResponse({
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}

// 配置允许的 HTTP 方法
export const config = {
  api: {
    bodyParser: false,
  },
};
