import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import corsOptions from './config/corsOptions'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.use(cookieParser())

	app.enableCors(corsOptions)

	const config = new DocumentBuilder()
		.setTitle('Photo Visualiser Nest JS Api')
		.setDescription('The API description')
		.setVersion('1.0')
		.addTag('visualiser-api')
		.build()
	const documentFactory = () => SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api', app, documentFactory)

	await app.listen(process.env.PORT ?? 5001)
}
bootstrap()
