import { describe, it, expect } from '@jest/globals';
import { isValidEmail, isValidName } from '../utils/validation';

describe('isValidEmail', () => {
  it('returns true for a standard valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns true for email with subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('returns true for email with plus tag', () => {
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('trims whitespace and still validates', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('returns false for missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('returns false for missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('returns false for missing TLD', () => {
    expect(isValidEmail('user@example')).toBe(false);
  });

  it('returns false for spaces in middle', () => {
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('returns false for multiple @ signs', () => {
    expect(isValidEmail('user@@example.com')).toBe(false);
  });
});

describe('isValidName', () => {
  it('returns true for valid name with 4+ chars', () => {
    expect(isValidName('John')).toBe(true);
  });

  it('returns true for full name with space', () => {
    expect(isValidName('John Doe')).toBe(true);
  });

  it('returns true for hyphenated name', () => {
    expect(isValidName('Anne-Marie')).toBe(true);
  });

  it('returns true for name with apostrophe', () => {
    expect(isValidName("O'Brien")).toBe(true);
  });

  it('returns true for name with accented characters', () => {
    expect(isValidName('José García')).toBe(true);
  });

  it('trims whitespace before validation', () => {
    expect(isValidName('  John  ')).toBe(true);
  });

  it('returns false for name shorter than 4 chars', () => {
    expect(isValidName('Jo')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidName('')).toBe(false);
  });

  it('returns false for name with numbers', () => {
    expect(isValidName('John123')).toBe(false);
  });

  it('returns false for name with special characters', () => {
    expect(isValidName('John@Doe')).toBe(false);
  });

  it('returns false for only whitespace (trimmed length < 4)', () => {
    expect(isValidName('   ')).toBe(false);
  });
});