import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UserService } from 'src/user/user.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private configService: ConfigService,
		private userService: UserService
	) {
		const jwtSecret = configService.get('JWT_SECRET')
		if (!jwtSecret) {
			// * This should ideally be caught by Joi, but provides a runtime safeguard
			throw new Error(
				'JWT_SECRET is not defined in the environment variables.'
			)
		}

		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true, // later for better practice is to allow expiration
			secretOrKey: jwtSecret // configService.get<string>('JWT_SECRET')
		})
	}

	async validate({ id }: { id: string }) {
		const user = await this.userService.getById(id)
		if (!user) {
			throw new UnauthorizedException()
		}
		return user
	}
}
