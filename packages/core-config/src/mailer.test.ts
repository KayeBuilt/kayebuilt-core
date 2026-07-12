import { describe, expect, it, vi } from 'vitest';
import { ConsoleMailer } from './mailer.js';

describe('ConsoleMailer', () => {
  it('logs the message and resolves without throwing', async () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const mailer = new ConsoleMailer();
    await expect(
      mailer.send({ to: 'jason@example.com', subject: 'Test', html: '<p>hi</p>' }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('jason@example.com'));
    spy.mockRestore();
  });
});
