import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator'

// DTO for handling a new photo upload request
export class CreatePhotoDto {
    @IsNotEmpty({ message: 'Title is required' })
    @IsString()
    @MaxLength(100)
    title: string

    // Latitude of the photo location
    @IsNotEmpty({ message: 'Latitude is required' })
    @IsNumber()
    latitude: number

    // Longitude of the photo location
    @IsNotEmpty({ message: 'Longitude is required' })
    @IsNumber()
    longitude: number
    
    // NOTE: The 'imageUrl' is typically generated *after* the file is uploaded
    // to storage, so for a file upload endpoint, you might only pass the file itself,
    // and the backend service handles the upload, gets the URL, and then creates the Photo entity.
    // However, if the frontend handles the upload first, you'd use the URL here:
    // @IsUrl()
    // imageUrl: string 
    
    // A DTO for retrieving photo data for display on the map
    // (This would typically omit sensitive data like 'userId' and format
    // the output, often named PhotoRdo - Resource Data Object, or PhotoResponseDto)
}

export class PhotoRdo {
    id: string
    title: string
    imageUrl: string
    latitude: number
    longitude: number
    aiDescription: string | null
    createdAt: Date
    user: {
        id: string
        name: string | null
    }

    commentsCount: number
}
