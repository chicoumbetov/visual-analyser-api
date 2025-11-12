// /Users/shynggys.umbetov/Documents/JOB/tech-interview-tests/hylight/visual-analyser-api/src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import corsOptions from './config/corsOptions'

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: true,
        rawBody: false,
        bufferLogs: true,
    })

    app.use(require('body-parser').json({ limit: '50mb' }))
    app.use(require('body-parser').urlencoded({ limit: '50mb', extended: true }))
    app.use(require('body-parser').raw({ limit: '50mb' })); 

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

    const port = process.env.PORT ?? 5001
    await app.listen(port, '0.0.0.0')
}
bootstrap()
