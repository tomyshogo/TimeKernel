import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WeatherData, WeatherSettings } from '../../types/weather';
import { getClothingSuggestion, getWeatherEmoji, formatTemp } from '../../utils/weatherClothing';

interface Props {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  settings: WeatherSettings;
  onRefresh: () => void;
}

export function WeatherCard({ weather, isLoading, error, settings, onRefresh }: Props) {
  if (!settings.enabled) return null;

  if (isLoading && !weather) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#3498db" />
      </View>
    );
  }

  if (error && !weather) {
    return (
      <TouchableOpacity style={styles.container} onPress={onRefresh}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText}>タップで再取得</Text>
      </TouchableOpacity>
    );
  }

  if (!weather) return null;

  const unit = settings.unit;
  const suggestion = getClothingSuggestion(weather);
  const emoji = getWeatherEmoji(weather.icon);

  return (
    <TouchableOpacity style={styles.container} onPress={onRefresh} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.weatherMain}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View style={styles.tempBlock}>
            <Text style={styles.temp}>{formatTemp(weather.temp, unit)}</Text>
            <Text style={styles.description}>{weather.description}</Text>
          </View>
        </View>
        <View style={styles.details}>
          <Text style={styles.detailText}>
            {formatTemp(weather.tempMax, unit)} / {formatTemp(weather.tempMin, unit)}
          </Text>
          <Text style={styles.detailText}>降水 {weather.pop}%</Text>
          <Text style={styles.cityText}>{weather.cityName}</Text>
        </View>
      </View>
      <View style={styles.suggestionRow}>
        <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
        <Text style={styles.suggestionText}>{suggestion.message}</Text>
      </View>
      {suggestion.rainWarning && (
        <Text style={styles.rainWarning}>{suggestion.rainWarning}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 32,
  },
  tempBlock: {
    marginLeft: 4,
  },
  temp: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  description: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  details: {
    alignItems: 'flex-end',
  },
  detailText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  cityText: {
    fontSize: 11,
    color: '#bdc3c7',
    marginTop: 2,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ecf0f1',
    gap: 6,
  },
  suggestionIcon: {
    fontSize: 16,
  },
  suggestionText: {
    fontSize: 13,
    color: '#34495e',
    flex: 1,
  },
  rainWarning: {
    fontSize: 13,
    color: '#2980b9',
    fontWeight: '600',
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#95a5a6',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 11,
    color: '#bdc3c7',
    textAlign: 'center',
    marginTop: 4,
  },
});
