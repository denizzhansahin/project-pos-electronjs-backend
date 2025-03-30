import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import refreshJwtConfig from './config/refresh-jwt.config';
import { ConfigType } from '@nestjs/config';
import { CurrentUser } from './types/current-user';

@Injectable()
export class AuthService {

    constructor(private userService:UserService,private jwtService:JwtService,
        @Inject(refreshJwtConfig.KEY) private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>
    ){}
    //kullanıcı bilgisine göre doğrulama yapma
    async validateUser(email:string,password:string) {
        console.log("email-şifre 1")
        const user = await this.userService.findByEmail(email)
        if(!user) throw new UnauthorizedException("User not found")
        const isPasswordMatch = await compare(password,user.password)
        if(!isPasswordMatch)
            throw new UnauthorizedException('Invalid credentials')
        return { id: user.id, role: user.role, user }
    }

    //gelen kullanıcı bilgisine göre token oluşturma
    login(userId:number){
        console.log("login token")
        const payload:AuthJwtPayload = {sub:userId}
        const token =  this.jwtService.sign(payload)
        const refreshToken = this.jwtService.sign(payload,this.refreshTokenConfig)
        return {
            id: userId,
            token,
            refreshToken
        }
    }


    refreshToken(userId: any) {
        console.log("login token refresh")
        const payload:AuthJwtPayload = {sub:userId}
        const token =  this.jwtService.sign(payload)
        return {
            id:userId,
            token,
        }
      }


    
  async validateJwtUser(userId:number){
    console.log(userId)
    const user = await this.userService.findOne(userId)
    console.log(user)
    console.log(user)
    console.log(user)
    if(!user) throw new UnauthorizedException("User not found!")
    const currentUser:CurrentUser = {id:user.id, role:user.role}
    return currentUser
  }
}
