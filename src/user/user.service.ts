import { Injectable } from '@nestjs/common'
import { hash } from 'argon2'
import { AuthDto } from 'src/auth/dto/auth.dto'
import { PrismaService } from 'src/prisma.service'

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

	/**
	 * Finds a user by ID and includes all relevant entities for the visual-analyser project.
	 * @param id The user's unique ID.
	 */
	async getById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: {
				id
			},
			include: {
				photos: true,
				comments: true
			}
		})

		return user
	}

    /**
     * Finds a user by email, primarily used during login and registration checks.
     * @param email The user's email address.
     */
    async getByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                email
            },
            include: {
                photos: true,
                comments: true
            }
        })

        return user
    }

    /**
     * Creates a new user record in the database.
     * @param dto Data transfer object containing name, email, and plain password.
     */
    async create(dto: AuthDto) {
        return this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: await hash(dto.password)
            }
        })
    }
}
