import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class AuthDto {
	@IsOptional()
	@IsString()
	name: string

	@IsString({
		message: 'email-required'
	})
	@IsEmail()
	email: string

	@MinLength(6, {
		message: 'password-at-least-6-symbols'
	})
	@IsString({
		message: 'password-required'
	})
	password: string
}
