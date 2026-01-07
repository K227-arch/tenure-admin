import { NextResponse } from 'next/server';
import { listKycImages, uploadKycImage, deleteKycImage } from '@/lib/supabase/kyc-storage';
import { db } from '@/lib/db';
import { kycVerification } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const kycId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get KYC record with verification_data from database
    const kycRecord = await db.execute(sql`
      SELECT * FROM kyc_verification WHERE id = ${kycId} LIMIT 1
    `);

    if (kycRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'KYC record not found' },
        { status: 404 }
      );
    }

    const verificationData = kycRecord[0].verification_data as any || {};
    const documents = verificationData.documents || [];

    // Get signed URLs for each document stored in the database
    const images = [];
    for (const doc of documents) {
      if (doc.filePath && doc.bucketName === 'kyc-images') {
        // Get signed URL from S3
        const result = await listKycImages(userId, kycId);
        if (result.success && result.images) {
          const matchingImage = result.images.find(img => img.path === doc.filePath);
          if (matchingImage) {
            images.push({
              id: doc.id || `${kycId}-${doc.documentType}-${Date.now()}`,
              url: matchingImage.url,
              path: doc.filePath,
              documentType: doc.documentType,
              fileName: doc.fileName,
              fileSize: doc.fileSize,
              fileType: doc.fileType,
              uploadedAt: doc.uploadedAt || kycRecord[0].created_at,
              bucketName: doc.bucketName,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      images
    });

  } catch (error) {
    console.error('Error fetching KYC images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const kycId = params.id;
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !userId || !documentType) {
      return NextResponse.json(
        { success: false, error: 'File, userId, and documentType are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, WebP, GIF, and PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Upload to S3 storage
    const uploadResult = await uploadKycImage({
      file,
      userId,
      kycId,
      documentType
    });

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 500 }
      );
    }

    // Get current KYC record
    const kycRecord = await db.execute(sql`
      SELECT * FROM kyc_verification WHERE id = ${kycId} LIMIT 1
    `);

    if (kycRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'KYC record not found' },
        { status: 404 }
      );
    }

    // Update verification_data JSONB field with new file info
    const currentVerificationData = (kycRecord[0].verification_data as any) || {};
    const currentDocuments = currentVerificationData.documents || [];
    
    const newDocument = {
      id: `${kycId}-${documentType}-${Date.now()}`,
      fileName: file.name,
      filePath: uploadResult.path!,
      fileSize: file.size,
      fileType: file.type,
      documentType: documentType,
      bucketName: 'kyc-images',
      storageProvider: 'supabase',
      uploadedAt: new Date().toISOString(),
      uploadStatus: 'uploaded'
    };

    const updatedDocuments = [...currentDocuments, newDocument];
    const updatedVerificationData = {
      ...currentVerificationData,
      documents: updatedDocuments
    };

    // Update the KYC record with new document info
    await db.execute(sql`
      UPDATE kyc_verification 
      SET 
        verification_data = ${JSON.stringify(updatedVerificationData)},
        updated_at = NOW()
      WHERE id = ${kycId}
    `);

    return NextResponse.json({
      success: true,
      path: uploadResult.path,
      documentId: newDocument.id,
      message: 'Image uploaded and recorded in KYC verification successfully'
    });

  } catch (error) {
    console.error('Error uploading KYC image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const kycId = params.id;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const imagePath = searchParams.get('path');

    if (!documentId && !imagePath) {
      return NextResponse.json(
        { success: false, error: 'Document ID or image path is required' },
        { status: 400 }
      );
    }

    // Get current KYC record
    const kycRecord = await db.execute(sql`
      SELECT * FROM kyc_verification WHERE id = ${kycId} LIMIT 1
    `);

    if (kycRecord.length === 0) {
      return NextResponse.json(
        { success: false, error: 'KYC record not found' },
        { status: 404 }
      );
    }

    const currentVerificationData = (kycRecord[0].verification_data as any) || {};
    const currentDocuments = currentVerificationData.documents || [];
    let documentToDelete = null;
    let pathToDelete = imagePath;

    // Find document by ID or path
    if (documentId) {
      documentToDelete = currentDocuments.find((doc: any) => doc.id === documentId);
      if (!documentToDelete) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }
      pathToDelete = documentToDelete.filePath;
    } else if (imagePath) {
      documentToDelete = currentDocuments.find((doc: any) => doc.filePath === imagePath);
    }

    if (!pathToDelete) {
      return NextResponse.json(
        { success: false, error: 'No path to delete' },
        { status: 400 }
      );
    }

    // Delete from S3 storage
    const result = await deleteKycImage(pathToDelete);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Remove document from the documents array in verification_data
    const updatedDocuments = currentDocuments.filter((doc: any) => 
      doc.id !== documentId && doc.filePath !== pathToDelete
    );

    const updatedVerificationData = {
      ...currentVerificationData,
      documents: updatedDocuments
    };

    // Update the KYC record
    await db.execute(sql`
      UPDATE kyc_verification 
      SET 
        verification_data = ${JSON.stringify(updatedVerificationData)},
        updated_at = NOW()
      WHERE id = ${kycId}
    `);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully from both S3 and KYC record'
    });

  } catch (error) {
    console.error('Error deleting KYC image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}