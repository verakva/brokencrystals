import { Injectable, Logger } from '@nestjs/common';
import { AuthService, JwtProcessorType } from 'src/auth/auth.service';

@Injectable()
export class AuthUtilsService {
  private readonly logger = new Logger(AuthUtilsService.name);

  constructor(private readonly authService: AuthService) {}

  async isAuthorizationViaCookiesValid(cookies: {
    [cookieName: string]: string;
  }): Promise<Boolean> {
    let isAuthenticated = false;

    try {
      const authCookieName = 'authorization';
      const authCookieValue = cookies[authCookieName] || '';

      this.logger.debug(
        `${authCookieName} cookie value is: ${authCookieValue}`,
      );

      isAuthenticated = new Boolean(
        await this.authService.validateToken(
          authCookieValue,
          JwtProcessorType.RSA,
        ),
      ).valueOf();
    } catch (error) {
      this.logger.debug(
        `Error while checking isAuthorizationViaCookiesValid: ${error}`,
      );
      isAuthenticated = false;
    }

    this.logger.debug(
      `isAuthorizationViaCookiesValid result: ${isAuthenticated}`,
    );
    return isAuthenticated;
  }
}
