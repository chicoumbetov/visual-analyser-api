import { Module } from '@nestjs/common';
import { AiModule } from 'src/ai/ai.module'; // <-- IMPORT AiModule HERE
import { PrismaService } from 'src/prisma.service';
import { StorageModule } from 'src/storage/storage.module';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';

@Module({
    // * import StorageModule because PhotoService depends on StorageService.
    imports: [
        StorageModule, 
        AiModule,
    ],
    controllers: [PhotoController],
    providers: [PhotoService, PrismaService],
    exports: [PhotoService],
})
export class PhotoModule {}
