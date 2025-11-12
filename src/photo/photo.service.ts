import { Injectable } from '@nestjs/common';
import { Photo } from 'generated/prisma';
import { AiService } from 'src/ai/ai.service';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CreatePhotoDto, PhotoRdo } from './dto/create-photo.dto';

@Injectable()
export class PhotoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly aiService: AiService,
    ) {}

    /**
     * Handles the file upload, AI analysis, and saves the photo metadata to the database.
     */
    async create(file: Express.Multer.File, dto: CreatePhotoDto, userId: string): Promise<Photo> {
        // * 1. Upload file to Supabase Storage
        const imageUrl = await this.storageService.uploadPhoto(file, userId)

        // * 2. Generate AI Description (Non-Streaming/Sync)
        // If the AI call fails, it will return null, and the upload will still succeed.
        const aiDescription = await this.aiService.generateImageDescription(file);

        /* Next time : true scalable HyLight production system, I must formally articulate the plan to move the generateImageDescription call to a background worker/queue.
            // 1. Upload and save basic metadata (FAST)
            const newPhoto = await this.prisma.photo.create({ data: {..., aiDescription: null} });

            // 2. Post a job to a dedicated queue (e.g., Redis Queue, BullMQ, NestJS/bull)
            await this.queueService.addAiAnalysisJob({ photoId: newPhoto.id, fileBuffer: file.buffer, mimeType: file.mimetype }); 
        */

        // * 3. Save metadata to the database
        const newPhoto = await this.prisma.photo.create({
            data: {
                title: dto.title,
                latitude: parseFloat(String(dto.latitude)),
                longitude: parseFloat(String(dto.longitude)),
                imageUrl: imageUrl, 
                userId: userId,
                aiDescription: aiDescription, // <-- 4. SAVE AI DESCRIPTION
            },
        })

        return newPhoto
    }

    /**
     * Retrieves all photo records required to display markers on the map.
     * @returns A list of photos (or PhotoRdo subset) for the map.
     */
    async findAllForMap(): Promise<PhotoRdo[]> {
        const photos = await this.prisma.photo.findMany({
            select: {
                id: true,
                title: true,
                latitude: true,
                longitude: true,
                imageUrl: true,
                aiDescription: true,
                createdAt: true,
                user: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
            },
        })

        // * Map Prisma result to PhotoRdo for clean API output
        return photos.map(photo => ({
            id: photo.id,
            title: photo.title,
            imageUrl: photo.imageUrl,
            latitude: photo.latitude,
            longitude: photo.longitude,
            aiDescription: photo.aiDescription,
            createdAt: photo.createdAt,
            user: photo.user,
            commentsCount: photo._count.comments, // * Use the aggregated count
        }))
    }

    /**
     * Retrieves a single photo, including full details and comments (optional, for the photo popup/view).
     * @param id The ID of the photo.
     * @returns The full photo details or null.
     */
    async findOne(id: string) {
        return this.prisma.photo.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true } },
                comments: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        })
    }

}
