import {
  getClothingSuggestion,
  getWeatherEmoji,
  formatTemp,
} from '../weatherClothing';
import { WeatherData } from '../../types/weather';

const makeWeather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
  temp: 20,
  tempMax: 25,
  tempMin: 15,
  pop: 10,
  icon: '01d',
  description: '晴れ',
  fetchedAt: new Date().toISOString(),
  cityName: '東京',
  ...overrides,
});

describe('getClothingSuggestion', () => {
  describe('気温帯別の服装提案', () => {
    it('30℃以上 → 半袖・短パン', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 32 }));
      expect(result.message).toContain('半袖');
      expect(result.message).toContain('日焼け止め');
      expect(result.icon).toBe('👕');
    });

    it('25〜29℃ → 半袖 + 薄手の羽織', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 27 }));
      expect(result.message).toContain('半袖');
      expect(result.message).toContain('冷房対策');
    });

    it('20〜24℃ → 長袖・カーディガン', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 22 }));
      expect(result.message).toContain('長袖');
    });

    it('15〜19℃ → パーカー・ジャケット', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 17 }));
      expect(result.message).toContain('パーカー');
    });

    it('10〜14℃ → しっかりアウター', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 12 }));
      expect(result.message).toContain('アウター');
    });

    it('5〜9℃ → コート + マフラー + 手袋', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 7 }));
      expect(result.message).toContain('コート');
      expect(result.message).toContain('手袋');
    });

    it('4℃以下 → 厚手コート + フル装備', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 2 }));
      expect(result.message).toContain('厚手コート');
      expect(result.message).toContain('ヒートテック');
    });
  });

  describe('降水確率による傘リマインド', () => {
    it('降水確率50%以上で傘警告あり', () => {
      const result = getClothingSuggestion(makeWeather({ pop: 60 }));
      expect(result.rainWarning).toBe('☔ 傘を忘れずに！');
    });

    it('降水確率50%未満で傘警告なし', () => {
      const result = getClothingSuggestion(makeWeather({ pop: 30 }));
      expect(result.rainWarning).toBeUndefined();
    });

    it('降水確率ちょうど50%で傘警告あり', () => {
      const result = getClothingSuggestion(makeWeather({ pop: 50 }));
      expect(result.rainWarning).toBe('☔ 傘を忘れずに！');
    });
  });

  describe('境界値テスト', () => {
    it('ちょうど30℃ → 半袖・短パン', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 30 }));
      expect(result.message).toContain('日焼け止め');
    });

    it('ちょうど25℃ → 半袖 + 冷房対策', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 25 }));
      expect(result.message).toContain('冷房対策');
    });

    it('ちょうど0℃ → フル装備', () => {
      const result = getClothingSuggestion(makeWeather({ temp: 0 }));
      expect(result.message).toContain('ヒートテック');
    });

    it('氷点下 → フル装備', () => {
      const result = getClothingSuggestion(makeWeather({ temp: -5 }));
      expect(result.message).toContain('ヒートテック');
    });
  });
});

describe('getWeatherEmoji', () => {
  it('晴れ（昼）→ ☀️', () => {
    expect(getWeatherEmoji('01d')).toBe('☀️');
  });

  it('晴れ（夜）→ 🌙', () => {
    expect(getWeatherEmoji('01n')).toBe('🌙');
  });

  it('雨 → 🌦️', () => {
    expect(getWeatherEmoji('10d')).toBe('🌦️');
  });

  it('雷雨 → ⛈️', () => {
    expect(getWeatherEmoji('11d')).toBe('⛈️');
  });

  it('雪 → 🌨️', () => {
    expect(getWeatherEmoji('13d')).toBe('🌨️');
  });

  it('不明なコード → デフォルト 🌤️', () => {
    expect(getWeatherEmoji('99x')).toBe('🌤️');
  });
});

describe('formatTemp', () => {
  it('摂氏表示', () => {
    expect(formatTemp(25.3, 'celsius')).toBe('25℃');
  });

  it('華氏変換', () => {
    expect(formatTemp(0, 'fahrenheit')).toBe('32°F');
  });

  it('華氏変換（100℃ → 212°F）', () => {
    expect(formatTemp(100, 'fahrenheit')).toBe('212°F');
  });

  it('小数点を四捨五入（摂氏）', () => {
    expect(formatTemp(25.7, 'celsius')).toBe('26℃');
  });

  it('小数点を四捨五入（華氏）', () => {
    expect(formatTemp(25.5, 'fahrenheit')).toBe('78°F');
  });

  it('マイナス気温（摂氏）', () => {
    expect(formatTemp(-10, 'celsius')).toBe('-10℃');
  });

  it('マイナス気温（華氏）', () => {
    expect(formatTemp(-40, 'fahrenheit')).toBe('-40°F');
  });
});
