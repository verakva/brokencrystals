import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
  Res,
  SerializeOptions,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserDto } from './api/UserDto';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { JwtType } from '../auth/jwt/jwt.type.decorator';
import { JwtProcessorType } from '../auth/auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AnyFilesInterceptor } from '../components/any-files.interceptor';
import {
  SWAGGER_DESC_PHOTO_USER_BY_EMAIL,
  SWAGGER_DESC_FIND_USER,
  SWAGGER_DESC_UPLOAD_USER_PHOTO,
  SWAGGER_DESC_UPDATE_USER_INFO,
  SWAGGER_DESC_ADMIN_RIGHTS,
  SWAGGER_DESC_DELETE_PHOTO_USER_BY_ID,
} from './users.controller.swagger.desc';
import { AdminGuard } from './users.guard';
import { PermissionDto } from './api/PermissionDto';
import { BASIC_USER_INFO } from './api/UserDto';
import { parseXml } from 'libxmljs';

@Controller('/api/users')
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('User controller')
export class UsersOneController {
  private logger = new Logger(UsersOneController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('/one/:email')
  @ApiQuery({ name: 'email', example: 'john.doe@example.com', required: true })
  @SerializeOptions({ groups: [BASIC_USER_INFO] })
  @ApiOperation({
    description: SWAGGER_DESC_FIND_USER,
  })
  @ApiOkResponse({
    type: UserDto,
    description: 'Returns basic user info if it exists',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async getByEmail(@Param('email') email: string): Promise<UserDto> {
    try {
      this.logger.debug(`Find a user by email: ${email}`);
      return new UserDto(await this.usersService.findByEmail(email));
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @Get('/one/:email/photo')
  @ApiQuery({ name: 'email', example: 'john.doe@example.com', required: true })
  @UseGuards(AuthGuard)
  @JwtType(JwtProcessorType.RSA)
  @ApiOperation({
    description: SWAGGER_DESC_PHOTO_USER_BY_EMAIL,
  })
  @ApiOkResponse({
    description: 'Returns user profile photo',
  })
  @ApiNoContentResponse({
    description: 'Returns empty content if photo is not set',
  })
  @ApiForbiddenResponse({
    description: 'Returns then user is not authenticated',
  })
  async getUserPhoto(
    @Param('email') email: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    this.logger.debug(`Find a user photo by email: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException({
        error: 'Could not file user',
        location: __filename,
      });
    }

    if (!user.photo) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }

    try {
      return user.photo;
    } catch (err) {
      throw new InternalServerErrorException({
        error: err.message,
        location: __filename,
      });
    }
  }

  @Delete('/one/:id/photo')
  @ApiQuery({ name: 'id', example: 1, required: true })
  @UseGuards(AuthGuard)
  @JwtType(JwtProcessorType.RSA)
  @ApiOperation({
    description: SWAGGER_DESC_DELETE_PHOTO_USER_BY_ID,
  })
  @ApiOkResponse({
    description: 'Deletes user profile photo',
  })
  @ApiNoContentResponse({
    description: 'Returns empty content if there was no user profile photo',
  })
  @ApiForbiddenResponse({
    description: 'Returns when user is not authenticated',
  })
  @ApiUnauthorizedResponse({
    description: 'Returns when isAdmin is false',
  })
  async deleteUserPhotoById(
    @Param('id') id: number,
    @Query('isAdmin') isAdminParam: string,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    isAdminParam = isAdminParam.toLowerCase();
    const isAdmin =
      isAdminParam === 'true' || isAdminParam === '1' ? true : false;
    if (!isAdmin) {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException({
        error: 'Could not file user',
        location: __filename,
      });
    }

    await this.usersService.deletePhoto(id);
  }

  @Put('/one/:email/info')
  @ApiQuery({ name: 'email', example: 'john.doe@example.com', required: true })
  @UseGuards(AuthGuard)
  @JwtType(JwtProcessorType.RSA)
  @ApiOperation({
    description: SWAGGER_DESC_UPDATE_USER_INFO,
  })
  @ApiForbiddenResponse({
    description: 'invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns updated user',
  })
  async changeUserInfo(
    @Body() newData: UserDto,
    @Param('email') email: string,
    @Req() req: FastifyRequest,
  ): Promise<UserDto> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('Could not find user');
      }
      if (this.originEmail(req) !== email) {
        throw new ForbiddenException();
      }
      return new UserDto(await this.usersService.updateUserInfo(user, newData));
    } catch (err) {
      throw new HttpException(
        err.message || 'Internal server error',
        err.status || 500,
      );
    }
  }

  @Get('/one/:email/info')
  @ApiQuery({ name: 'email', example: 'john.doe@example.com', required: true })
  @UseGuards(AuthGuard)
  @JwtType(JwtProcessorType.RSA)
  @ApiOperation({
    description: SWAGGER_DESC_FIND_USER,
  })
  @ApiForbiddenResponse({
    description: 'invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  @ApiNotFoundResponse()
  @ApiOkResponse({
    description: 'Returns user info',
  })
  async getUserInfo(
    @Param('email') email: string,
    @Req() req: FastifyRequest,
  ): Promise<UserDto> {
    try {
      const user = await this.usersService.findByEmail(email);

      if (!user) {
        throw new NotFoundException('Could not find user');
      }
      if (this.originEmail(req) !== email) {
        throw new ForbiddenException();
      }
      return new UserDto(user);
    } catch (err) {
      throw new HttpException(
        err.message || 'Internal server error',
        err.status || 500,
      );
    }
  }

  @Get('/one/:email/adminpermission')
  @ApiQuery({ name: 'email', example: 'john.doe@example.com', required: true })
  @UseGuards(AuthGuard, AdminGuard)
  @JwtType(JwtProcessorType.RSA)
  @ApiOperation({
    description: SWAGGER_DESC_ADMIN_RIGHTS,
  })
  @ApiForbiddenResponse({
    description: 'user has no admin rights',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns true if user has admin rights',
  })
  getAdminStatus(@Param('email') email: string): Promise<PermissionDto> {
    return this.usersService.getPermissions(email);
  }

  @Put('/one/:email/photo')
  @ApiQuery({ name: 'email', example: 'john.doe@example.com', required: true })
  @UseGuards(AuthGuard)
  @JwtType(JwtProcessorType.RSA)
  @ApiOperation({
    description: SWAGGER_DESC_UPLOAD_USER_PHOTO,
  })
  @ApiOkResponse({
    description: 'Photo updated',
  })
  @UseInterceptors(AnyFilesInterceptor)
  async uploadFile(@Param('email') email: string, @Req() req: FastifyRequest) {
    try {
      const file = await req.file();
      const file_name = file.filename;
      const file_buffer = await file.toBuffer();

      if (file_name.endsWith('.svg')) {
        const xml = file_buffer.toString();
        const xmlDoc = parseXml(xml, {
          dtdload: true,
          noent: true,
          doctype: true,
          dtdvalid: true,
          errors: true,
          recover: true,
        });
        await this.usersService.updatePhoto(
          email,
          Buffer.from(xmlDoc.toString(), 'utf8'),
        );
        return xmlDoc.toString(true);
      } else {
        await this.usersService.updatePhoto(email, file_buffer);
      }
    } catch (err) {
      throw new InternalServerErrorException({
        error: err.message,
        location: __filename,
      });
    }
  }

  private originEmail(request: FastifyRequest): string {
    return JSON.parse(
      Buffer.from(
        request.headers.authorization.split('.')[1],
        'base64',
      ).toString(),
    ).user;
  }
}
