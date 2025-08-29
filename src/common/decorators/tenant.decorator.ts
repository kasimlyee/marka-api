import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('Tenant decorator - request.tenant:', request.tenant);
    console.log('Tenant decorator - request.user:', request.user);
    console.log('Tenant decorator - request.headers:', request.headers);
    return request.tenant;
  },
);
