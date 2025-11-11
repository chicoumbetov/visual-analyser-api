import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import * as Joi from 'joi'

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				JWT_SECRET: Joi.string().required(),
				GOOGLE_CLIENT_ID: Joi.string().required(),
				GOOGLE_CLIENT_SECRET: Joi.string().required(),
				SERVER_URL: Joi.string().required().uri()
			}),
			isGlobal: true
		})
	],
	exports: [ConfigModule]
})
export class AppConfigModule {}
