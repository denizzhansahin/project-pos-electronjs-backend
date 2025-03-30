import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector:Reflector){}
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requireRols = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY,[
      context.getHandler(),
      context.getClass()
    ])
    if(!requireRols) return true;
    const user = context.switchToHttp().getRequest().user //jwt.strategy içindeki user ile ilgili validate içinden alınacak
    console.log({user})
    const hasRequiredRole = requireRols.some((role)=>user.role==role)//role kontrolü
    return hasRequiredRole
  }
}
