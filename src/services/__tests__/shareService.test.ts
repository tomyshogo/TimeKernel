// expo-clipboard をモック
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

import {
  generateShareLink,
  generateDeepLink,
  extractCalendarIdFromLink,
} from '../shareService';

describe('generateShareLink', () => {
  it('WebリンクにカレンダーIDを含む', () => {
    expect(generateShareLink('abc123')).toBe(
      'https://timekernel.app/join/abc123'
    );
  });

  it('長いIDでも正しく生成', () => {
    const id = 'aVeryLongCalendarId12345';
    expect(generateShareLink(id)).toContain(id);
  });
});

describe('generateDeepLink', () => {
  it('ディープリンクにカレンダーIDを含む', () => {
    expect(generateDeepLink('abc123')).toBe('timekernel://join/abc123');
  });
});

describe('extractCalendarIdFromLink', () => {
  it('WebリンクからID抽出', () => {
    expect(
      extractCalendarIdFromLink('https://timekernel.app/join/abc123')
    ).toBe('abc123');
  });

  it('ディープリンクからID抽出', () => {
    expect(
      extractCalendarIdFromLink('timekernel://join/abc123')
    ).toBe('abc123');
  });

  it('無関係なURLはnull', () => {
    expect(extractCalendarIdFromLink('https://google.com')).toBeNull();
  });

  it('空文字はnull', () => {
    expect(extractCalendarIdFromLink('')).toBeNull();
  });

  it('完全に無関係なURLはnull', () => {
    expect(
      extractCalendarIdFromLink('https://example.com/other/path')
    ).toBeNull();
  });

  it('URLの途中にあるリンクもマッチ', () => {
    expect(
      extractCalendarIdFromLink(
        'Check this: https://timekernel.app/join/xyz789 !'
      )
    ).toBe('xyz789');
  });
});
