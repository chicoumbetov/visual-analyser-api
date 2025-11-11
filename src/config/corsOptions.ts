const PROD_CLIENT_URL = 'https://visual-analyser.vercel.app'
const DEV_CLIENT_URL = 'http://localhost:3000'

const allowedOrigins = [
    PROD_CLIENT_URL,
    DEV_CLIENT_URL,
    process.env.CLIENT_URL,
    null, // * for Postman, mobile apps, or same-origin requests
];

const corsOptions = {
    credentials: true,
    exposedHeaders: 'set-cookie',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    origin: (origin: string | undefined, callback: any) => {
        // If the origin is undefined (which can happen in Postman or local server-to-server calls), or is null (same-origin, Postman, etc.)
        if (!origin || allowedOrigins.includes(origin)) {
            // console.log(`CORS allowed for origin: ${origin}`)
            callback(null, true)
        } 
        // We include the check for null origin for robust Postman/local testing
        else if (allowedOrigins.includes(null) && origin === undefined) { 
            callback(null, true)
        }
        else {
            console.error(`CORS blocked for origin: ${origin}`)
            callback(new Error('Not allowed by CORS'), false)
        }
    },
    optionsSuccessStatus: 200,
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'X-Requested-With',
        'Origin'
    ]
}

export default corsOptions
