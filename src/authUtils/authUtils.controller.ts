import {
  Body,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import {
  API_DESC_GET_CSRF,
  API_DESC_POST_CSRF,
} from './authUtils.controller.swagger.desc';
import { AuthUtilsService as AuthUtilsService } from './authUtils.service';
import { AuthService } from 'src/auth/auth.service';
import { SetAuthCookieMaxAgeRequest } from './api/SetAuthCookieMaxAgeRequest';

/* All EPs are vulnerable to CSRF in accordance with the reqirements of BC-95 */
@Controller('/api/authUtils')
@ApiTags('AuthUtils controller')
export class AuthUtilsController {
  private readonly logger = new Logger(AuthUtilsController.name);

  constructor(
    private readonly authUtilsService: AuthUtilsService,
    private readonly authService: AuthService,
  ) {}

  @Post('setAuthCookieMaxAge')
  @ApiOperation({ description: API_DESC_POST_CSRF })
  @Header('Content-Type', 'application/x-www-form-urlencoded') // required
  async setAuthCookieMaxAge(
    @Body() body: SetAuthCookieMaxAgeRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ): Promise<void> {
    // I check the authentication by myself! No AuthGuard :)
    const isAuthenticated =
      await this.authUtilsService.isAuthorizationViaCookiesValid(req.cookies);

    if (isAuthenticated) {
      const token = req.cookies['authorization'] || '';
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

  // Maybe refreshAuthCookie? `/api/authUtils`
  // Note, this doesn't affect the JWT expiration value, only the browser-side expiration
  @Get('removeCookieExpiration')
  @ApiOperation({ description: API_DESC_GET_CSRF })
  @ApiOkResponse({ type: String })
  async getCsrf(
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
