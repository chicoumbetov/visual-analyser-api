import { Module } from '@nestjs/common'

import { AuthModule } from './auth/auth.module'
import { JwtStrategy } from './auth/strategies/jwt.strategy'
import { CommentModule } from './comment/comment.module'
import { AppConfigModule } from './config/config.module'
import { PhotoModule } from './photo/photo.module'
import { StorageModule } from './storage/storage.module'
import { UserModule } from './user/user.module'
@Module({
	imports: [
		AppConfigModule,
		AuthModule,
		UserModule,
    StorageModule,
    PhotoModule,
    CommentModule
	],
	providers: [JwtStrategy]
})
export class AppModule {}
