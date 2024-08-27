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

  describe('GET /spawn', () => {
    it('should not be able to execute shell commands on the host operating system', async () => {
      await runner
        .createScan({ tests: [TestType.OSI], name: 'OS Command Injection' })
        .timeout(timeout)
        .run({
          method: 'GET',
          url: `${process.env.SEC_TESTER_TARGET}/api/spawn?command=pwd`,
        });
    });
  });
});
