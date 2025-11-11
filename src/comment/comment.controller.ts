import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/user/decorators/user.decorator';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('photos/:photoId/comments')
export class CommentController {
    constructor(private readonly commentService: CommentService) {}

    /**
     * Endpoint to post a new comment on a specific photo.
     * POST /photos/:photoId/comments
     * Requires authentication.
     */
    @Auth()
    @Post()
    async createComment(
        @Param('photoId') photoId: string,
        @CurrentUser('id') userId: string,
        @Body() dto: CreateCommentDto,
    ) {
        return this.commentService.create(photoId, userId, dto);
    }
    
    /**
     * Endpoint to retrieve all comments for a specific photo.
     * GET /photos/:photoId/comments
     * Does not require authentication (public view).
     */
    @Get()
    async getCommentsByPhoto(
        @Param('photoId') photoId: string,
    ) {
        return this.commentService.getByPhotoId(photoId);
    }
}
