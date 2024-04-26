import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  API_DESC_GET_CSRF,
  API_DESC_POST_CSRF,
} from './csrf.controller.swagger.desc';
import { CsrfService } from './csrf.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtProcessorType } from 'src/auth/auth.service';
import { JwtType } from 'src/auth/jwt/jwt.type.decorator';


@Controller('/api/csrf')
@ApiTags('CSRF controller')
export class CsrfController {
  private readonly logger = new Logger(CsrfController.name);

  constructor(private readonly csrfService: CsrfService) {}

  // **** Vulnerable to Post CSRF - Implements requirements of BC-95 ****
  @Post('postCsrf')
  @ApiQuery({
    name: 'param',
    type: 'string',
    example: 'someValue',
    required: true,
  })
  @UseGuards(AuthGuard)
  @JwtType(JwtProcessorType.BEARER)
  @ApiOperation({
    description: API_DESC_GET_CSRF,
  })
  @ApiOkResponse({
    type: String,
  })
  @Header('Content-Type', 'application/x-www-form-urlencoded')
  async postCsrf(
    @Query('param') param: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<String> {
    let cookies = request.cookies;

    this.logger.debug(`Testing GET CSRF EP with param="${param}"`);
    this.logger.debug(`GET CSRF EP cookies: ${cookies}`);

    res.cookie('authCookieName', 'authCookieValue', {
      httpOnly: false,
      sameSite: 'none',
      secure: 'auto',
      domain: '',
    });

    return 'SomeBinaryData?';
  }
}
