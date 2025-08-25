import { AuthService } from './auth.service';
import { AuthModule } from './auth.module';
export * from './dto/register.dto';
export * from './dto/refresh-token.dto';
export * from './decorators/roles.decorator';
export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';
export * from './strategies/jwt.strategy';
export * from './interfaces/jwt-payload.interface';

export { AuthService, AuthModule };