import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WeatherData, WeatherSettings, DEFAULT_WEATHER_SETTINGS } from '../../types/weather';
import { getClothingSuggestion, getWeatherEmoji, formatTemp } from '../../utils/weatherClothing';

interface Props {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  settings?: WeatherSettings;
  onRefresh: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getGradient(icon: string): [string, string] {
  if (icon.startsWith('01')) return ['#4facfe', '#00f2fe'];
  if (icon.startsWith('02') || icon.startsWith('03')) return ['#a1c4fd', '#c2e9fb'];
  if (icon.startsWith('04')) return ['#8e9eab', '#eef2f3'];
  if (icon.startsWith('09') || icon.startsWith('10')) return ['#667eea', '#764ba2'];
  if (icon.startsWith('11')) return ['#434343', '#000000'];
  if (icon.startsWith('13')) return ['#e6dada', '#274046'];
  return ['#89f7fe', '#66a6ff'];
}

export function WeatherCard({
  weather,
  isLoading,
  error,
  settings = DEFAULT_WEATHER_SETTINGS,
  onRefresh,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!settings.enabled) return null;

  if (isLoading && !weather) {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.loadingText}>天気を取得中...</Text>
      </Animated.View>
    );
  }

  if (error && !weather) {
    return (
      <Pressable style={styles.errorContainer} onPress={onRefresh}>
        <Ionicons name="cloud-offline-outline" size={24} color="#95a5a6" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText}>タップで再取得</Text>
      </Pressable>
    );
  }

  if (!weather) return null;

  const unit = settings.unit;
  const suggestion = getClothingSuggestion(weather);
  const emoji = getWeatherEmoji(weather.icon);
  const gradient = getGradient(weather.icon);
  const isNight = weather.icon.endsWith('n');

  return (
    <AnimatedPressable
      entering={FadeInDown.duration(400).springify()}
      style={[styles.container, animStyle]}
      onPress={onRefresh}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 200 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 200 }); }}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.topRow}>
          <View style={styles.weatherMain}>
            <Text style={styles.emoji}>{emoji}</Text>
            <View>
              <Text style={styles.temp}>{formatTemp(weather.temp, unit)}</Text>
              <Text style={styles.description}>{weather.description}</Text>
            </View>
          </View>
          <View style={styles.details}>
            <View style={styles.detailChip}>
              <Ionicons name="arrow-up" size={10} color="#fff" />
              <Text style={styles.detailText}>{formatTemp(weather.tempMax, unit)}</Text>
            </View>
            <View style={styles.detailChip}>
              <Ionicons name="arrow-down" size={10} color="#ffffffAA" />
              <Text style={[styles.detailText, { opacity: 0.8 }]}>
                {formatTemp(weather.tempMin, unit)}
              </Text>
            </View>
            <View style={styles.detailChip}>
              <Ionicons name="water-outline" size={10} color="#ffffffCC" />
              <Text style={[styles.detailText, { opacity: 0.9 }]}>{weather.pop}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.suggestionRow}>
          <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
          <Text style={styles.suggestionText}>{suggestion.message}</Text>
        </View>

        {suggestion.rainWarning && (
          <View style={styles.rainRow}>
            <Text style={styles.rainWarning}>{suggestion.rainWarning}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Ionicons name="location-outline" size={11} color="#ffffffAA" />
          <Text style={styles.cityText}>{weather.cityName}</Text>
          <Ionicons name="refresh-outline" size={11} color="#ffffffAA" style={{ marginLeft: 'auto' }} />
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  gradient: {
    padding: 16,
  },
  loadingContainer: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#95a5a6',
  },
  errorContainer: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  retryText: {
    fontSize: 11,
    color: '#bdc3c7',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 40,
  },
  temp: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 13,
    color: '#ffffffCC',
    fontWeight: '600',
  },
  details: {
    gap: 4,
    alignItems: 'flex-end',
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ffffff30',
    marginVertical: 10,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionIcon: {
    fontSize: 18,
  },
  suggestionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  rainRow: {
    marginTop: 6,
    backgroundColor: '#ffffff25',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rainWarning: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  cityText: {
    fontSize: 11,
    color: '#ffffffAA',
    fontWeight: '500',
  },
});
