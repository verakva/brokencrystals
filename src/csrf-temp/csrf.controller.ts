import {
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
    ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  API_DESC_GET_CSRF,
  API_DESC_POST_CSRF,
} from './csrf.controller.swagger.desc';
import { CsrfService } from './csrf.service';
import { AuthService, JwtProcessorType } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { JwtType } from 'src/auth/jwt/jwt.type.decorator';


/* Vulnerable to CSRF in accordance to reqirements of BC-95 */
@Controller('/api/csrf')
@ApiTags('CSRF controller')
export class CsrfController {
  private readonly logger = new Logger(CsrfController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
  ) {}

  @Post('postCsrf')
  @ApiOperation({ description: API_DESC_POST_CSRF })
  @ApiOkResponse({ type: String })
  @Header('Content-Type', 'application/x-www-form-urlencoded')
  async postCsrf(
    // @Query('param') param: string,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<String> {
    let cookies = request.cookies;

    this.logger.debug(`POST CSRF EP cookies: ${cookies}`);

    let isAuthenticated = 'asd'; // this.validateCookies(cookies);

    // res.cookie('authCookieName', 'authCookieValue', {
    //   httpOnly: false,
    //   sameSite: 'none',
    //   secure: 'auto',
    //   domain: '',
    // });

    return `is auth? ${isAuthenticated}`;
  }

  @Post('getCsrf')
  @ApiOperation({ description: API_DESC_GET_CSRF })
  @ApiOkResponse({ type: String })
  @UseGuards(AuthGuard)
  @JwtType(JwtProcessorType.RSA)
  @ApiForbiddenResponse({
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  //   @Header('Content-Type', 'application/x-www-form-urlencoded')
  async getCsrf(@Req() request: FastifyRequest): Promise<String> {
    const authCookieName = 'connect.sid';
    const processorType = JwtProcessorType.RSA;

    let cookies = request.cookies;
    let connect_sid = cookies[authCookieName].toString() || '';

    this.logger.debug(`connect.sid cookie value is: ${connect_sid}`);

    let isAuthenticated = await this.authService.validateToken(
      connect_sid,
      processorType,
    );

    this.logger.debug(`Is user authenticated? ${isAuthenticated}`);

    // res.cookie('maxTestCookie', 'maxTestCookieVal', {
    //   httpOnly: false,
    //   sameSite: 'none',
    //   domain: '',
    // });

    return `is auth? ${isAuthenticated}`;
  }

  async validateCookies(cookies: { [cookieName: string]: string }) {
    const authCookieName = 'connect.sid';
    let connect_sid = cookies[authCookieName].toString() || '';

    this.logger.debug(`222 connect.sid cookie 2222: ${connect_sid}`);

    let isAuthenticated = await this.authService.validateToken(
      connect_sid,
      JwtProcessorType.RSA,
    );

    this.logger.debug(`Is user valid? ${isAuthenticated}`);

    return isAuthenticated;
  }
}
