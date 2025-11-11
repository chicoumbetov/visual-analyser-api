import { Injectable } from '@nestjs/common';
import { Photo } from 'generated/prisma';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CreatePhotoDto, PhotoRdo } from './dto/create-photo.dto';

@Injectable()
export class PhotoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) {}

    /**
     * Handles the file upload and saves the photo metadata to the database.
     * @param file The image file buffer.
     * @param dto Photo metadata (title, lat, lng).
     * @param userId The ID of the authenticated user.
     * @returns The created Photo entity.
     */
    async create(file: Express.Multer.File, dto: CreatePhotoDto, userId: string): Promise<Photo> {
        // * Upload file to Supabase Storage
        const imageUrl = await this.storageService.uploadPhoto(file, userId)

        // * Save metadata to the database
        const newPhoto = await this.prisma.photo.create({
            data: {
                title: dto.title,
                latitude: dto.latitude,
                longitude: dto.longitude,
                imageUrl: imageUrl, // Stored public URL
                userId: userId,
            },
        })

        // TODO: integrate the AI feature later, the call to the AI service 
        // TODO: would happen here, and the result would update the newPhoto record.

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
