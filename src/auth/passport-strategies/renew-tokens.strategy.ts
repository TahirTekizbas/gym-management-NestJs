import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { refreshJwtConfig } from '../constants/jwt.config';
import { UserRepository } from '../user.repository';
import { TokensService } from '../../Shared-Modules/tokens/tokens.service';

@Injectable()
export class RenewTokensStrategy extends PassportStrategy(
    Strategy,
    'no-user-refresh-strategy',
) {
    constructor(
        private readonly tokenService: TokensService,
        @InjectRepository(UserRepository)
        private userRepository: UserRepository,
    ) {
        super({
            passReqToCallback: true,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: refreshJwtConfig.secret, // gets secret from environment variables
        });
    }

    async validate(req: any, payload: any): Promise<{ refreshToken: string, email: string }> {

        const header = req.headers.authorization;
        const refreshToken = await this.tokenService.refreshTokenExists(header);

        if (!refreshToken) {
            throw new UnauthorizedException();
        }

        const { email } = payload;
        return { refreshToken, email };
    }
}