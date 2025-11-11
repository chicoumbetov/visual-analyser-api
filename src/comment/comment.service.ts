import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { CommentRdo, CreateCommentDto } from './dto/create-comment.dto'

@Injectable()
export class CommentService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Creates a new comment linked to a specific photo and user.
     * @param photoId The ID of the photo being commented on.
     * @param userId The ID of the authenticated user.
     * @param dto The comment text.
     * @returns The created comment object.
     */
    async create(photoId: string, userId: string, dto: CreateCommentDto): Promise<CommentRdo> {
        const photo = await this.prisma.photo.findUnique({ where: { id: photoId } })
        if (!photo) {
            throw new NotFoundException('Photo not found.')
        }

        const comment = await this.prisma.comment.create({
            data: {
                text: dto.text,
                photoId: photoId,
                userId: userId,
            },
            // Include user data for the RDO response immediately
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        // Map Prisma result to CommentRdo
        return {
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            user: comment.user,
        }
    }
    
    /**
     * Retrieves all comments for a specific photo.
     * @param photoId The ID of the photo.
     * @returns A list of comments.
     */
    async getByPhotoId(photoId: string): Promise<CommentRdo[]> {
        const comments = await this.prisma.comment.findMany({
            where: { photoId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        // * Map Prisma results to CommentRdo
        return comments.map(comment => ({
            id: comment.id,
            text: comment.text,
            createdAt: comment.createdAt,
            user: comment.user,
        }))
    }
}
