import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface KycImageUpload {
  file: File;
  userId: string;
  kycId: string;
  documentType: string; // e.g., 'passport', 'driver_license', 'selfie', etc.
}

export interface KycImageInfo {
  url: string;
  path: string;
  documentType: string;
  uploadedAt: string;
  size: number;
}

/**
 * Upload a KYC document image to Supabase storage
 */
export async function uploadKycImage(upload: KycImageUpload): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const { file, userId, kycId, documentType } = upload;
    
    // Generate a unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${documentType}_${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${kycId}/${fileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from('kyc-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading KYC image:', error);
      return { success: false, error: error.message };
    }

    return { success: true, path: data.path };
  } catch (error) {
    console.error('Error in uploadKycImage:', error);
    return { success: false, error: 'Failed to upload image' };
  }
}

/**
 * Get signed URL for a KYC image
 */
export async function getKycImageUrl(path: string, expiresIn: number = 3600): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from('kyc-images')
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error('Error in getKycImageUrl:', error);
    return { success: false, error: 'Failed to get image URL' };
  }
}

/**
 * List all images for a specific KYC record
 */
export async function listKycImages(userId: string, kycId: string): Promise<{ success: boolean; images?: KycImageInfo[]; error?: string }> {
  try {
    const folderPath = `${userId}/${kycId}`;
    
    const { data, error } = await supabase.storage
      .from('kyc-images')
      .list(folderPath);

    if (error) {
      console.error('Error listing KYC images:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, images: [] };
    }

    // Get signed URLs for all images
    const images: KycImageInfo[] = [];
    
    for (const file of data) {
      if (file.name && !file.name.endsWith('/')) { // Skip folders
        const fullPath = `${folderPath}/${file.name}`;
        const urlResult = await getKycImageUrl(fullPath);
        
        if (urlResult.success && urlResult.url) {
          // Extract document type from filename
          const documentType = file.name.split('_')[0];
          
          images.push({
            url: urlResult.url,
            path: fullPath,
            documentType,
            uploadedAt: file.created_at || '',
            size: file.metadata?.size || 0
          });
        }
      }
    }

    return { success: true, images };
  } catch (error) {
    console.error('Error in listKycImages:', error);
    return { success: false, error: 'Failed to list images' };
  }
}

/**
 * Delete a KYC image
 */
export async function deleteKycImage(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('kyc-images')
      .remove([path]);

    if (error) {
      console.error('Error deleting KYC image:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteKycImage:', error);
    return { success: false, error: 'Failed to delete image' };
  }
}

/**
 * Delete all images for a KYC record
 */
export async function deleteAllKycImages(userId: string, kycId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const listResult = await listKycImages(userId, kycId);
    
    if (!listResult.success || !listResult.images) {
      return { success: false, error: listResult.error || 'Failed to list images' };
    }

    if (listResult.images.length === 0) {
      return { success: true }; // No images to delete
    }

    const paths = listResult.images.map(img => img.path);
    
    const { error } = await supabase.storage
      .from('kyc-images')
      .remove(paths);

    if (error) {
      console.error('Error deleting KYC images:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteAllKycImages:', error);
    return { success: false, error: 'Failed to delete images' };
  }
}