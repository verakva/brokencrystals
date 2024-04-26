import { Module } from '@nestjs/common';
import { CsrfService } from './csrf.service';
import { CsrfController } from './csrf.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [AuthModule, CsrfService],
  controllers: [CsrfController],
  exports: [CsrfService],
})
export class CsrfModule {}
