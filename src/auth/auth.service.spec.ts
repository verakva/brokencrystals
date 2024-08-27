import * as fs from 'fs';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientService } from '../httpclient/httpclient.service';
import { KeyCloakService } from '../keycloak/keycloak.service';
import { AuthService } from './auth.service';

jest.mock('fs');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    (fs.readFileSync as jest.Mock) = jest.fn((path: string) =>
      path.toLowerCase().includes('json') ? '{}' : 'mocked-key-content',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EntityManager,
          useValue: {},
        },
        {
          provide: KeyCloakService,
          useValue: {},
        },
        {
          provide: HttpClientService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => key,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
