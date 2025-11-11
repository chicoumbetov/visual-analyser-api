import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

// * DTO for adding a new comment to a photo
export class CreateCommentDto {
    @IsNotEmpty({ message: 'Comment text is required' })
    @IsString()
    @MaxLength(500, { message: 'Comment must be 500 characters or less' })
    text: string

    // Note: The photoId is usually passed as a URL parameter (e.g., /photos/:photoId/comments)
}

// * DTO for retrieving comment data
export class CommentRdo {
    id: string
    text: string
    createdAt: Date
    user: {
        id: string
        name: string | null
    }
}
