import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Header,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Options,
  Param,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserRequest, SignupMode } from './api/CreateUserRequest';
import { UserDto } from './api/UserDto';
import { LdapQueryHandler } from './ldap.query.handler';
import { UsersService } from './users.service';
import { User } from '../model/user.entity';
import { FastifyRequest } from 'fastify';
import { KeyCloakService } from '../keycloak/keycloak.service';
import {
  SWAGGER_DESC_CREATE_BASIC_USER,
  SWAGGER_DESC_FIND_USER,
  SWAGGER_DESC_LDAP_SEARCH,
  SWAGGER_DESC_OPTIONS_REQUEST,
  SWAGGER_DESC_CREATE_OIDC_USER,
  SWAGGER_DESC_FIND_USERS,
  SWAGGER_DESC_FIND_FULL_USER_INFO,
} from './users.controller.swagger.desc';
import { BASIC_USER_INFO, FULL_USER_INFO } from './api/UserDto';

@Controller('/api/users')
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('User controller')
export class UsersController {
  private logger = new Logger(UsersController.name);
  private ldapQueryHandler = new LdapQueryHandler();

  constructor(
    private readonly usersService: UsersService,
    private readonly keyCloakService: KeyCloakService,
  ) {}

  @Options()
  @ApiOperation({
    description: SWAGGER_DESC_OPTIONS_REQUEST,
  })
  @Header('Access-Control-Request-Headers', 'OPTIONS, GET, POST, DELETE')
  async getTestOptions(): Promise<void> {
    this.logger.debug(`Test OPTIONS`);
  }

  @Get('/id/:id')
  @ApiQuery({ name: 'id', example: 1, required: true })
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
  async getById(@Param('id') id: number): Promise<UserDto> {
    try {
      this.logger.debug(`Find a user by id: ${id}`);
      return new UserDto(await this.usersService.findById(id));
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @Get('/fullinfo/:email')
  @ApiQuery({ name: 'email', example: 'john.doe@example.com', required: true })
  @SerializeOptions({ groups: [FULL_USER_INFO] })
  @ApiOperation({
    description: SWAGGER_DESC_FIND_FULL_USER_INFO,
  })
  @ApiOkResponse({
    type: UserDto,
    description: 'Returns full user info if it exists',
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
  async getFullUserInfo(@Param('email') email: string): Promise<UserDto> {
    try {
      this.logger.debug(`Find a full user info by email: ${email}`);
      return new UserDto(await this.usersService.findByEmail(email));
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @Get('/search/:name')
  @ApiQuery({ name: 'name', example: 'john', required: true })
  @SerializeOptions({ groups: [FULL_USER_INFO] })
  @ApiOperation({
    description: SWAGGER_DESC_FIND_USERS,
  })
  @ApiOkResponse({
    type: UserDto,
    description: SWAGGER_DESC_FIND_USERS,
  })
  async searchByName(@Param('name') name: string): Promise<UserDto[]> {
    try {
      this.logger.debug(`Search users by name: ${name}`);
      const users = await this.usersService.searchByName(name, 50);
      return users.map((user) => new UserDto(user));
    } catch (err) {
      throw new HttpException(err.message, err.status);
    }
  }

  @Get('/ldap')
  @ApiQuery({
    name: 'query',
    example:
      '(&(objectClass=person)(objectClass=user)(email=john.doe@example.com))',
    required: true,
  })
  @ApiOperation({
    description: SWAGGER_DESC_LDAP_SEARCH,
  })
  @ApiOkResponse({
    type: UserDto,
    isArray: true,
  })
  async ldapQuery(@Query('query') query: string): Promise<UserDto[]> {
    this.logger.debug(`Call ldapQuery: ${query}`);
    let users: User[];

    try {
      const email = this.ldapQueryHandler.parseQuery(query);

      if (email && email.endsWith('*')) {
        users = await this.usersService.findByEmailPrefix(email.slice(0, -1));
      } else {
        const user = await this.usersService.findByEmail(email);

        if (user) {
          users = [user];
        }
      }
    } catch (err) {
      throw new InternalServerErrorException({
        error: err.message,
        location: __filename,
      });
    }

    if (!users) {
      throw new NotFoundException('User not found in ldap');
    }

    return users.map((user: User) => new UserDto(user));
  }

  @Post('/basic')
  @ApiOperation({
    description: SWAGGER_DESC_CREATE_BASIC_USER,
  })
  @ApiConflictResponse({
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
        error: { type: 'string' },
      },
    },
    description: 'User Already exists',
  })
  @ApiCreatedResponse({
    type: UserDto,
    description: 'User created',
  })
  async createUser(@Body() user: CreateUserRequest): Promise<UserDto> {
    try {
      this.logger.debug(`Create a basic user: ${user}`);

      const userExists = await this.doesUserExist(user);
      if (userExists) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      return new UserDto(
        await this.usersService.createUser(user, user.op === SignupMode.BASIC),
      );
    } catch (err) {
      throw new HttpException(
        err.message ?? 'Something went wrong',
        err.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/oidc')
  @ApiOperation({
    description: SWAGGER_DESC_CREATE_OIDC_USER,
  })
  @ApiConflictResponse({
    schema: {
      type: 'object',
      properties: {
        errorMessage: { type: 'string' },
      },
    },
    description: 'User Already exists',
  })
  @ApiCreatedResponse({
    description: 'User created, returns empty object',
  })
  async createOIDCUser(@Body() user: CreateUserRequest): Promise<UserDto> {
    try {
      this.logger.debug(`Create a OIDC user: ${user}`);

      const userExists = await this.doesUserExist(user);

      if (userExists) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      const keycloakUser = new UserDto(
        await this.keyCloakService.registerUser({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          password: user.password,
        }),
      );

      this.createUser(user);

      return keycloakUser;
    } catch (err) {
      throw new HttpException(
        err.response.data ?? 'Something went wrong',
        err.response.status ?? 500,
      );
    }
  }

  private async doesUserExist(user: UserDto): Promise<boolean> {
    try {
      const userExists = await this.usersService.findByEmail(user.email);
      if (userExists) {
        return true;
      }
    } catch (err) {
      if (err.status === HttpStatus.NOT_FOUND) {
        return false;
      }
      throw new HttpException(
        err.message ?? 'Something went wrong',
        err.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
