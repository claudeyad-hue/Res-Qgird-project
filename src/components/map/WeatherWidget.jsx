import React, { useEffect, useState } from 'react';
import { weatherService } from '../../services/weatherService';

/**
 * WeatherWidget — Live Open-Meteo weather display for Ghaziabad operational area.
 * Shows on the map status bar. Auto-refreshes every 10 minutes.
 * Degrades gracefully when Open-Meteo is offline.
 */
export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadWeather() {
    setLoading(true);
    const data = await weatherService.getCurrentWeather();
    setWeather(data);
    setLoading(false);
  }

  useEffect(() => {
    loadWeather();
    const interval = setInterval(loadWeather, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <span style={{ fontSize: '11px', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        🌡️ …
      </span>
    );
  }

  if (!weather || weather.isFallback) {
    return (
      <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }} title="Weather data unavailable">
        🌡️ N/A
      </span>
    );
  }

  const advisory = weatherService.getWeatherAdvisory(weather);
  const advisoryColor = advisory?.level === 'critical' ? 'var(--critical)'
    : advisory?.level === 'high' ? 'var(--high)'
    : advisory?.level === 'medium' ? '#D4AC0D'
    : 'var(--ink-muted)';

  return (
    <span
      style={{
        fontSize: '11px',
        color: advisory ? advisoryColor : 'var(--ink-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        cursor: advisory ? 'help' : 'default',
        fontWeight: advisory ? 600 : 400,
      }}
      title={advisory
        ? `⚠ ${advisory.message} | ${weather.label} ${weather.temperature}°C, Wind ${weather.windspeed} km/h | Source: ${weather.source}`
        : `${weather.label} | Wind ${weather.windspeed} km/h | Source: ${weather.source}`
      }
    >
      <span>{weather.icon}</span>
      <span>{weather.temperature}°C</span>
      {advisory && <span>⚠</span>}
    </span>
  );
}
