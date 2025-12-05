import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class BusinessAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const businessId = request.params.businessId || request.body.businessId;
    
    if (!user || !businessId) {
      return false;
    }
    
    return this.hasBusinessAccess(user, businessId);
  }
  
  private hasBusinessAccess(user: any, businessId: string): boolean {
    if (user.role === 'ADMIN') {
      return true;
    }
    
    return user.businessId === businessId || user.businessIds?.includes(businessId);
  }
}
