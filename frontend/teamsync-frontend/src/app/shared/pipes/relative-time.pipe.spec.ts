import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => { pipe = new RelativeTimePipe(); });

  it('returns "just now" for dates < 1 minute ago', () => {
    const d = new Date(Date.now() - 30 * 1000).toISOString();
    expect(pipe.transform(d)).toBe('just now');
  });

  it('returns "Xm ago" for dates < 1 hour ago', () => {
    const d = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(pipe.transform(d)).toBe('5m ago');
  });

  it('returns "Xh ago" for dates < 24 hours ago', () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(d)).toBe('3h ago');
  });

  it('returns "Xd ago" for dates < 7 days ago', () => {
    const d = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(d)).toBe('2d ago');
  });

  it('returns empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
  });
});
