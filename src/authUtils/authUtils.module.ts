import { Module } from '@nestjs/common';
import { AuthUtilsService } from './authUtils.service';
import { AuthUtilsController } from './authUtils.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AuthUtilsService],
  controllers: [AuthUtilsController],
  exports: [AuthUtilsService],
})
export class AuthUtilsModule {}
