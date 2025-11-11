import { Body, Controller, Get, NotFoundException, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { CurrentUser } from 'src/user/decorators/user.decorator';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotoService } from './photo.service';

@Controller('photos')
export class PhotoController {
    constructor(private readonly photoService: PhotoService) {}

    /**
     * Endpoint for uploading a new geotagged photo.
     * POST /photos
     * Requires authentication.
     */
    @Auth()
    @Post()
    @UseInterceptors(FileInterceptor('image')) // 'image' is the field name expected in the form data
    async uploadPhoto(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreatePhotoDto,
        @CurrentUser('id') userId: string,
    ) {
        if (!file) {
            // Handle error if no file is provided
            // Throw a BadRequestException (requires import)
            throw new Error('File not provided.'); 
        }

        // * The DTO contains title, latitude, and longitude
        return this.photoService.create(file, dto, userId);
    }

    /**
     * Endpoint for retrieving all photo markers for the map view.
     * GET /photos
     * Does not require authentication (public view).
     */
    @Get()
    async getMapMarkers() {
        return this.photoService.findAllForMap();
    }
    
    /**
     * Endpoint for retrieving a single photo and its comments.
     * GET /photos/:id
     */
    @Get(':id')
    async getPhotoDetails(@Param('id') id: string) {
        const photo = await this.photoService.findOne(id);
        if (!photo) {
            // Throw a NotFoundException (requires import)
            throw new NotFoundException('Photo not found.');
        }
        return photo;
    }
}