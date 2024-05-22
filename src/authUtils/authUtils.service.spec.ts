import { Test, TestingModule } from '@nestjs/testing';
import { AuthUtilsService } from './authUtils.service';

describe('CsrfService', () => {
  let service: AuthUtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthUtilsService],
    }).compile();

    service = module.get<AuthUtilsService>(AuthUtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
