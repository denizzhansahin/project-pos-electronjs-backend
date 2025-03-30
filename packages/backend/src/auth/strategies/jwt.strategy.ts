import { ConfigType } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import jwtConfig from "../config/jwt.config";
import { AuthJwtPayload } from "../types/auth-jwtPayload";
import { Inject, Injectable } from "@nestjs/common";
import { AuthService } from "../auth.service";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(@Inject(jwtConfig.KEY) private jwtConfiguration: ConfigType<typeof jwtConfig>,
    private authService : AuthService
) {
        //token ile ilgili işlem bölümü
        super(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: jwtConfiguration.secret || '',
                ignoreExpiration: false
            }
        )
    }

    validate(payload: AuthJwtPayload) {
        console.log("gelen token bilgisine göre id döndürme")
        //return { id: payload.sub }
        const userId = payload.sub
        return this.authService.validateJwtUser(userId)
    }
}