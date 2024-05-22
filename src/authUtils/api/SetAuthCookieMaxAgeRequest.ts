import { ApiProperty } from '@nestjs/swagger';

export class SetAuthCookieMaxAgeRequest {
  @ApiProperty()
  maxAgeSeconds: number;
}
