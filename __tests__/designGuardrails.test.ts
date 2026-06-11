import { describe, it, expect } from '@jest/globals';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Design-system guardrails. These keep the tokens/scaffold work from eroding:
 * once a value is a token, nobody should re-introduce a raw brand hex, a
 * negative-margin alignment hack, or a >100% overflow width.
 *
 * Scans app/ and components/ source (excludes theme/ where tokens are defined).
 */
const ROOTS = ['app', 'components'];

const walk = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

const files = ROOTS.flatMap(walk);
const read = (f: string) => readFileSync(f, 'utf8');

describe('design guardrails', () => {
  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('has no raw brand-cyan hex literals (use Colors.brand)', () => {
    const offenders = files.filter((f) => /#91D7E4|#84D3E8|#8FD3E8/i.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('has no negative margins/padding used for layout', () => {
    const offenders = files.filter((f) =>
      /(margin[A-Za-z]*|padding[A-Za-z]*):\s*-\d/.test(read(f))
    );
    expect(offenders).toEqual([]);
  });

  it('has no >100% overflow widths/marginLeft used for layout', () => {
    // Flags 101%–199% (overflow hacks); 100% and below are legitimate.
    const offenders = files.filter((f) =>
      /(width|marginLeft):\s*'(10[1-9]|1[1-9]\d)%'/.test(read(f))
    );
    expect(offenders).toEqual([]);
  });
});
