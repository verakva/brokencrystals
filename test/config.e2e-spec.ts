import { SecRunner } from '@sectester/runner';
import { TestType } from '@sectester/scan';

describe('/api', () => {
  const timeout = 600000;
  jest.setTimeout(timeout);

  let runner: SecRunner;

  beforeEach(async () => {
    runner = new SecRunner({ hostname: process.env.BRIGHT_CLUSTER });
    await runner.init();
  });

  afterEach(() => runner.clear());

  describe('GET /config', () => {
    it('should use and implement cookies with secure attributes', async () => {
      await runner
        .createScan({
          tests: [TestType.COOKIE_SECURITY],
          name: 'COOKIE_SECURITY',
        })
        .timeout(timeout)
        .run({
          method: 'GET',
          url: `${process.env.SEC_TESTER_TARGET}/api/config`,
        });
    });

    it('should contain proper Security Headers configuration', async () => {
      await runner
        .createScan({
          tests: [TestType.HEADER_SECURITY],
          name: 'HEADER_SECURITY',
        })
        .timeout(timeout)
        .run({
          method: 'GET',
          url: `${process.env.SEC_TESTER_TARGET}/api/config?query=no-sec-headers`,
        });
    });

    it('should not contain errors that include full webroot path', async () => {
      await runner
        .createScan({
          tests: [TestType.FULL_PATH_DISCLOSURE],
          name: 'FULL_PATH_DISCLOSURE',
        })
        .timeout(timeout)
        .run({
          method: 'GET',
          headers: {
            cookie: `bc-calls-counter=${Date.now().toString()}`,
          },
          url: `${process.env.SEC_TESTER_TARGET}/api/config`,
        });
    });
  });
});
