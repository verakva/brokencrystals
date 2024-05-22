import {
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  API_DESC_REMOVE_COOKIE_EXPIRATION,
  API_DESC_SET_AUTH_COOKIE_MAX_AGE,
} from './authUtils.controller.swagger.desc';
import { AuthUtilsService as AuthUtilsService } from './authUtils.service';
import { SetAuthCookieMaxAgeRequest } from './api/SetAuthCookieMaxAgeRequest';

/* All EPs are vulnerable to CSRF in accordance with the reqirements of BC-95 */
@Controller('/api/authUtils')
@ApiTags('AuthUtils controller')
export class AuthUtilsController {
  private readonly logger = new Logger(AuthUtilsController.name);

  constructor(private readonly authUtilsService: AuthUtilsService) {}

  @Post('setAuthCookieMaxAge')
  @ApiOperation({ description: API_DESC_SET_AUTH_COOKIE_MAX_AGE })
  @ApiQuery({
    name: 'csrfToken',
    type: 'string',
    example: '7JUm3YycGMqvAaU1FPFBRdt52yQeHrBX',
    required: false,
  })
  @Header('Content-Type', 'application/x-www-form-urlencoded') // required
  async setAuthCookieMaxAge(
    @Param() csrfToken = '',
    @Body() body: SetAuthCookieMaxAgeRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<void> {
    // I check the authentication by myself! No AuthGuard :)
    const isAuthenticated =
      await this.authUtilsService.isAuthorizationViaCookiesValid(req.cookies);

    if (isAuthenticated) {
      const token = req.cookies['authorization'];
      res.cookie('authorization', token, {
        maxAge: body.maxAgeSeconds * 1000,
        sameSite: 'none', // required
        secure: true, // A dependency of setting a value for sameSite
        domain: '',
        path: '/',
        httpOnly: true,
      });
      res.status(HttpStatus.OK);
    } else {
      res.status(HttpStatus.UNAUTHORIZED);
    }
  }

  // Note: this doesn't affect the JWT expiration value, only the browser-side expiration
  @Get('removeCookieExpiration')
  @ApiOperation({ description: API_DESC_REMOVE_COOKIE_EXPIRATION })
  @ApiQuery({
    name: 'csrfToken',
    type: 'string',
    example: '7JUm3YycGMqvAaU1FPFBRdt52yQeHrBX',
    required: false,
  })
  @ApiOkResponse({ type: String })
  async removeCookieExpiration(
    @Param() csrfToken = '',
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<String> {
    // I check the authentication by myself! No AuthGuard :)
    const isAuthenticated =
      await this.authUtilsService.isAuthorizationViaCookiesValid(req.cookies);

    if (isAuthenticated) {
      const token = req.cookies['authorization'];
      res.cookie('authorization', token, {
        // No sameSite set! This is a requirement,
        domain: '',
        path: '/',
        httpOnly: true,
      });
      res.status(HttpStatus.OK);
      return `Re-Setted the auth cookie`;
    }

    res.status(HttpStatus.UNAUTHORIZED);
    return `Removing auth cookie expiration was disallowed`;
  }
}
