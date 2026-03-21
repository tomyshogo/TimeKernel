export interface TrainStatus {
  /** 路線ID (ODPT形式) */
  lineId: string;
  /** 路線名 */
  lineName: string;
  /** 鉄道会社名 */
  operator: string;
  /** 運行ステータス */
  status: 'normal' | 'delay' | 'suspended';
  /** 状況の詳細テキスト */
  statusText: string;
  /** 遅延の原因 */
  cause?: string;
  /** 最終更新時刻 (ISO string) */
  updatedAt: string;
}

export interface TrainSettings {
  /** 機能ON/OFF */
  enabled: boolean;
  /** 登録済み路線のID一覧 */
  subscribedLines: string[];
}

export const DEFAULT_TRAIN_SETTINGS: TrainSettings = {
  enabled: false,
  subscribedLines: [],
};

/** 路線マスターデータ（選択UI用） */
export interface LineMaster {
  id: string;
  name: string;
  operator: string;
  color: string;
}

export const LINE_MASTERS: LineMaster[] = [
  // JR東日本
  { id: 'jr_yamanote', name: '山手線', operator: 'JR東日本', color: '#9acd32' },
  { id: 'jr_chuo_rapid', name: '中央線(快速)', operator: 'JR東日本', color: '#f15a22' },
  { id: 'jr_chuo_sobu', name: '中央・総武線(各停)', operator: 'JR東日本', color: '#ffd400' },
  { id: 'jr_keihin_tohoku', name: '京浜東北線', operator: 'JR東日本', color: '#00b2e5' },
  { id: 'jr_takasaki', name: '高崎線', operator: 'JR東日本', color: '#f68b1e' },
  { id: 'jr_utsunomiya', name: '宇都宮線', operator: 'JR東日本', color: '#f68b1e' },
  { id: 'jr_tokaido', name: '東海道線', operator: 'JR東日本', color: '#f68b1e' },
  { id: 'jr_yokosuka', name: '横須賀線', operator: 'JR東日本', color: '#0072bc' },
  { id: 'jr_sobu_rapid', name: '総武線(快速)', operator: 'JR東日本', color: '#0072bc' },
  { id: 'jr_saikyo', name: '埼京線', operator: 'JR東日本', color: '#00ac9a' },
  { id: 'jr_shonan_shinjuku', name: '湘南新宿ライン', operator: 'JR東日本', color: '#e21f26' },
  { id: 'jr_joban', name: '常磐線', operator: 'JR東日本', color: '#00b261' },
  { id: 'jr_musashino', name: '武蔵野線', operator: 'JR東日本', color: '#f15a22' },
  { id: 'jr_nambu', name: '南武線', operator: 'JR東日本', color: '#ffd400' },
  { id: 'jr_yokohama', name: '横浜線', operator: 'JR東日本', color: '#7cbb00' },

  // 東京メトロ
  { id: 'metro_ginza', name: '銀座線', operator: '東京メトロ', color: '#f39700' },
  { id: 'metro_marunouchi', name: '丸ノ内線', operator: '東京メトロ', color: '#e60012' },
  { id: 'metro_hibiya', name: '日比谷線', operator: '東京メトロ', color: '#9caeb7' },
  { id: 'metro_tozai', name: '東西線', operator: '東京メトロ', color: '#00a7db' },
  { id: 'metro_chiyoda', name: '千代田線', operator: '東京メトロ', color: '#00a650' },
  { id: 'metro_yurakucho', name: '有楽町線', operator: '東京メトロ', color: '#c1a470' },
  { id: 'metro_hanzomon', name: '半蔵門線', operator: '東京メトロ', color: '#8f76d6' },
  { id: 'metro_namboku', name: '南北線', operator: '東京メトロ', color: '#00ada9' },
  { id: 'metro_fukutoshin', name: '副都心線', operator: '東京メトロ', color: '#9c7e31' },

  // 都営地下鉄
  { id: 'toei_asakusa', name: '浅草線', operator: '都営地下鉄', color: '#e85298' },
  { id: 'toei_mita', name: '三田線', operator: '都営地下鉄', color: '#0079c2' },
  { id: 'toei_shinjuku', name: '新宿線', operator: '都営地下鉄', color: '#6cbb5a' },
  { id: 'toei_oedo', name: '大江戸線', operator: '都営地下鉄', color: '#b6007a' },

  // 私鉄
  { id: 'tokyu_toyoko', name: '東横線', operator: '東急', color: '#da0442' },
  { id: 'tokyu_denentoshi', name: '田園都市線', operator: '東急', color: '#00a040' },
  { id: 'tokyu_meguro', name: '目黒線', operator: '東急', color: '#009cd2' },
  { id: 'odakyu_odawara', name: '小田原線', operator: '小田急', color: '#2b59a5' },
  { id: 'keio_keio', name: '京王線', operator: '京王', color: '#e8318a' },
  { id: 'keio_inokashira', name: '井の頭線', operator: '京王', color: '#1d2088' },
  { id: 'seibu_ikebukuro', name: '池袋線', operator: '西武', color: '#003da5' },
  { id: 'seibu_shinjuku', name: '新宿線', operator: '西武', color: '#003da5' },
  { id: 'tobu_tojo', name: '東上線', operator: '東武', color: '#e44d93' },
  { id: 'tobu_skytree', name: 'スカイツリーライン', operator: '東武', color: '#e44d93' },
  { id: 'keisei_main', name: '京成本線', operator: '京成', color: '#003da5' },
  { id: 'keisei_oshiage', name: '京成押上線', operator: '京成', color: '#003da5' },
  { id: 'keisei_chiba', name: '京成千葉線', operator: '京成', color: '#003da5' },
  { id: 'keisei_chihara', name: '京成千原線', operator: '京成', color: '#003da5' },
  { id: 'keisei_higashinarita', name: '京成東成田線', operator: '京成', color: '#003da5' },
  { id: 'keisei_kanamachi', name: '京成金町線', operator: '京成', color: '#003da5' },
  { id: 'keisei_skyliner', name: 'スカイライナー', operator: '京成', color: '#003da5' },
  { id: 'keisei_matsudo', name: '新京成線(京成松戸線)', operator: '京成', color: '#e5007f' },
  { id: 'hokuso', name: '北総線', operator: '北総鉄道', color: '#0068b7' },
  { id: 'keikyu_main', name: '京急本線', operator: '京急', color: '#e60012' },
  { id: 'keikyu_kuko', name: '京急空港線', operator: '京急', color: '#e60012' },
  { id: 'keikyu_zushi', name: '京急逗子線', operator: '京急', color: '#e60012' },
  { id: 'keikyu_kurihama', name: '京急久里浜線', operator: '京急', color: '#e60012' },
  { id: 'tx', name: 'つくばエクスプレス', operator: '首都圏新都市鉄道', color: '#2b59a5' },
  { id: 'toyo_kosoku', name: '東葉高速線', operator: '東葉高速鉄道', color: '#00a7db' },
  { id: 'rinkai', name: 'りんかい線', operator: 'りんかい線', color: '#00b0dd' },
  { id: 'yurikamome', name: 'ゆりかもめ', operator: 'ゆりかもめ', color: '#00a0de' },
  { id: 'monorail', name: '東京モノレール', operator: '東京モノレール', color: '#b41e8e' },
  { id: 'sagami', name: '相鉄本線', operator: '相鉄', color: '#0068b7' },
  { id: 'sagami_izumino', name: '相鉄いずみ野線', operator: '相鉄', color: '#0068b7' },
  { id: 'nippori_toneri', name: '日暮里・舎人ライナー', operator: '東京都交通局', color: '#f08300' },
];
