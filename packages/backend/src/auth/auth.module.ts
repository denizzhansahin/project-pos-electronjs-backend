import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { LocalStrategy } from './strategies/local.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import refreshJwtConfig from './config/refresh-jwt.config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from './guards/roles/roles.guard';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]),
  JwtModule.registerAsync(jwtConfig.asProvider()),
  ConfigModule.forFeature(jwtConfig),
  ConfigModule.forFeature(refreshJwtConfig)
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, LocalStrategy, JwtStrategy,
  
    
{
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
    
  ],

})
export class AuthModule { }


/*


JwtModule.register({
  secret:"",
  signOptions:{
    expiresIn:"1d"
  }
})


*/