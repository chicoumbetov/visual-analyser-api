import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class StorageService {
    private supabase: SupabaseClient
    private readonly BUCKET_NAME = 'photos'

    constructor(private configService: ConfigService) {
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL')
        const supabaseKey = this.configService.get<string>('SUPABASE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            throw new InternalServerErrorException(
                'Supabase configuration (URL or Key) is missing.'
            )
        }

        this.supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false, // Not using Supabase Auth, only Storage
            },
        })
    }

    /**
     * Uploads a file buffer to Supabase Storage and returns the public URL.
     * @param file The file object from NestJS/Multer.
     * @param userId The ID of the user uploading the file (used for path organization).
     * @returns The public URL of the uploaded image.
     */
    async uploadPhoto(file: Express.Multer.File, userId: string): Promise<string> {
        // Generate a unique file path: e.g., 'photos/{userId}/{timestamp}-{originalName}'
        const timestamp = Date.now()
        const fileExtension = file.originalname.split('.').pop()
        const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`
        const filePath = `${userId}/${fileName}`
        
        // Upload the file
        const { data, error } = await this.supabase.storage
            .from(this.BUCKET_NAME)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            })

        if (error) {
            console.error('Supabase upload error:', error)
            throw new InternalServerErrorException('Failed to upload file to storage.')
        }

        const { data: publicUrlData } = this.supabase.storage
            .from(this.BUCKET_NAME)
            .getPublicUrl(data.path)
        
        return publicUrlData.publicUrl
    }
}
