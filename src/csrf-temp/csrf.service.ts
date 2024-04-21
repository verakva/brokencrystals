import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CsrfService {
  private readonly logger = new Logger(CsrfService.name);
}
