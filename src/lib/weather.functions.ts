import { createServerFn } from '@tanstack/react-start';

const OPENWEATHER_BASE = 'https://api.openweathermap.org';

export interface WeatherLookupInput {
  city?: string;
  latitude?: number;
  longitude?: number;
}

export const weatherLookup = createServerFn({ method: 'POST' })
  .validator((input: WeatherLookupInput) => input)
  .handler(async ({ data }): Promise<{ ok: true; data: any } | { ok: false; code: string; message: string }> => {
    const apiKey = process.env['WEATHER_API_KEY'] || process.env['OPENWEATHER_API_KEY'];
    if (!apiKey) {
      return { ok: false, code: 'NOT_CONFIGURED', message: 'Weather service not configured' };
    }

    try {
      let latitude: number | undefined = data.latitude;
      let longitude: number | undefined = data.longitude;
      let locationName = '';

      if (data.city?.trim()) {
        const query = encodeURIComponent(data.city.trim());
        const geoResponse = await fetch(
          `${OPENWEATHER_BASE}/geo/1.0/direct?q=${query}&limit=1&appid=${encodeURIComponent(apiKey)}`,
        );
        if (!geoResponse.ok) throw new Error(`Weather geocoding failed (${geoResponse.status})`);
        const matches = await geoResponse.json();
        if (!Array.isArray(matches) || matches.length === 0) {
          return { ok: false, code: 'NO_DATA', message: 'No weather data found for this location' };
        }
        latitude = matches[0].lat;
        longitude = matches[0].lon;
        locationName = [matches[0].name, matches[0].state, matches[0].country].filter(Boolean).join(', ');
      } else if (typeof latitude === 'number' && typeof longitude === 'number') {
        const reverseResponse = await fetch(
          `${OPENWEATHER_BASE}/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${encodeURIComponent(apiKey)}`,
        );
        if (reverseResponse.ok) {
          const matches = await reverseResponse.json();
          if (Array.isArray(matches) && matches[0]) {
            locationName = [matches[0].name, matches[0].state, matches[0].country].filter(Boolean).join(', ');
          }
        }
      } else {
        return { ok: false, code: 'INVALID_LOCATION', message: 'Choose a city or use your current location' };
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return { ok: false, code: 'NO_DATA', message: 'No weather data found for this location' };
      }

      const weatherResponse = await fetch(
        `${OPENWEATHER_BASE}/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly&units=metric&appid=${encodeURIComponent(apiKey)}`,
      );

      if (weatherResponse.status === 401) {
        return { ok: false, code: 'API_ERROR', message: 'The weather provider rejected the configured API key' };
      }
      if (!weatherResponse.ok) {
        throw new Error(`Weather provider request failed (${weatherResponse.status})`);
      }

      const weather = await weatherResponse.json();
      if (!weather?.current || !Array.isArray(weather.daily)) {
        return { ok: false, code: 'NO_DATA', message: 'No weather data is available for this location' };
      }

      return {
        ok: true,
        data: {
          location: locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          timezone: weather.timezone ?? null,
          current: weather.current,
          daily: weather.daily.slice(0, 7),
          alerts: Array.isArray(weather.alerts) ? weather.alerts : [],
          updatedAt: new Date().toISOString(),
        },
      };
    } catch {
      return { ok: false, code: 'API_ERROR', message: 'Unable to reach the weather service' };
    }
  });
