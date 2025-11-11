import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
    controllers: [CommentController],
    providers: [CommentService, PrismaService],
    exports: [CommentService],
})
export class CommentModule {}
