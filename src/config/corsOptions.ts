const allowedOrigins = [
	process.env.CLIENT_URL,
	'' // for Postman test
]

const corsOptions = {
	credentials: true,
	exposedHeaders: 'set-cookie',
	methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
	origin: (origin: any, callback: any) => {
		// console.log('CORS Origin:', origin, 'allowedOrigins :', allowedOrigins)
		if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
			// console.log(`CORS allowed for origin: ${origin}`)
			callback(null, true)
		} else {
			console.error(`CORS blocked for origin: ${origin}`)
			callback(new Error('Not allowed by CORS'))
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
