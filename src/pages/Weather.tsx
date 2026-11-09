import { FormEvent, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Cloud,
  Droplets,
  Loader2,
  MapPin,
  RefreshCw,
  Sun,
  ThermometerSun,
  Umbrella,
} from "lucide-react";
import { weatherLookup } from "@/lib/weather.functions";

type LoadState = "idle" | "loading" | "permission-denied" | "error" | "not-configured" | "no-data" | "success";

interface WeatherResponse {
  location: string;
  timezone: string | null;
  updatedAt: string;
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    wind_speed: number;
    rain?: Record<string, number>;
    weather?: Array<{ main: string; description: string }>;
  };
  daily: Array<{
    dt: number;
    temp: { min: number; max: number };
    pop: number;
    rain?: number;
    weather?: Array<{ main: string; description: string }>;
  }>;
  alerts: Array<{ event: string; description: string; start?: number; end?: number }>;
}

const Weather = () => {
  const [city, setCity] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  const loadWeather = async (input: { city?: string; latitude?: number; longitude?: number }) => {
    setState("loading");
    setMessage("");
    const result = await weatherLookup(input);
    if (result.ok) {
      setWeather(result.data as WeatherResponse);
      setState("success");
      return;
    }
    setWeather(null);
    if (result.code === "NOT_CONFIGURED") setState("not-configured");
    else if (result.code === "NO_DATA") setState("no-data");
    else setState("error");
    setMessage(result.message);
  };

  const searchCity = (event: FormEvent) => {
    event.preventDefault();
    if (city.trim()) void loadWeather({ city: city.trim() });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setState("error");
      setMessage("Location services are not supported by this browser");
      return;
    }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadWeather({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        setWeather(null);
        setState(error.code === error.PERMISSION_DENIED ? "permission-denied" : "error");
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. You can still search for a village or city."
            : "Unable to get your current location. Try searching for a village or city.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  const formatTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  const formatDay = (timestamp: number) =>
    new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" }).format(
      new Date(timestamp * 1000),
    );

  const rainAmount = weather?.current.rain
    ? Object.values(weather.current.rain).reduce((sum, value) => sum + value, 0)
    : null;

  const rainAlert = weather?.daily.some((day) => day.pop >= 0.6 || (day.rain ?? 0) >= 1);
  const heatAlert = weather
    ? weather.current.temp >= 40 || weather.daily.some((day) => day.temp.max >= 40)
    : false;
  const severeAlert = weather?.alerts.length ? weather.alerts[0] : null;

  return (
    <AppLayout title="Weather" showBack>
      <div className="px-4 py-5 space-y-5">
        <Card variant="elevated">
          <CardContent className="p-4 space-y-3">
            <form onSubmit={searchCity} className="flex gap-2">
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Village or city"
                aria-label="Village or city"
              />
              <Button type="submit" disabled={!city.trim() || state === "loading"}>
                Search
              </Button>
            </form>
            <Button variant="outline" className="w-full" type="button" onClick={useCurrentLocation} disabled={state === "loading"}>
              {state === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Use my current location
            </Button>
            <p className="text-xs text-muted-foreground">
              Location is requested only after you choose this button or search by city.
            </p>
          </CardContent>
        </Card>

        {state === "idle" && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Cloud className="mx-auto mb-3 h-10 w-10" />
              Search for a village/city or use your current location to view weather.
            </CardContent>
          </Card>
        )}

        {state === "loading" && (
          <Card>
            <CardContent className="p-8 flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              Loading weather data...
            </CardContent>
          </Card>
        )}

        {(state === "permission-denied" || state === "error" || state === "no-data" || state === "not-configured") && (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-warning" />
              <p className="font-semibold">
                {state === "permission-denied" ? "Location permission denied" : message || "Unable to load weather"}
              </p>
              {state === "not-configured" && <p className="mt-2 text-sm text-muted-foreground">Weather service not configured</p>}
              <Button variant="outline" className="mt-4" onClick={() => state === "permission-denied" ? useCurrentLocation() : setState("idle")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {state === "permission-denied" ? "Try location again" : "Try another location"}
              </Button>
            </CardContent>
          </Card>
        )}

        {state === "success" && weather && (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-lg font-bold"><MapPin className="h-4 w-4" />{weather.location}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Last updated: {formatTime(weather.updatedAt)}</p>
                  </div>
                  <Sun className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated" className="overflow-hidden">
              <div className="bg-gradient-sky p-5 text-info-foreground">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm opacity-80">Current weather</p>
                    <p className="mt-1 text-5xl font-bold">{Math.round(weather.current.temp)}°C</p>
                    <p className="mt-1 capitalize">{weather.current.weather?.[0]?.description || "Conditions unavailable"}</p>
                  </div>
                  <ThermometerSun className="mb-1 h-12 w-12 opacity-90" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/20 pt-4 sm:grid-cols-4">
                  <div><p className="text-xs opacity-80">Feels like</p><p className="font-semibold">{Math.round(weather.current.feels_like)}°C</p></div>
                  <div><p className="text-xs opacity-80">Humidity</p><p className="font-semibold">{weather.current.humidity}%</p></div>
                  <div><p className="text-xs opacity-80">Wind</p><p className="font-semibold">{Math.round(weather.current.wind_speed * 3.6)} km/h</p></div>
                  <div><p className="text-xs opacity-80">Rainfall</p><p className="font-semibold">{rainAmount == null ? "Not available" : `${rainAmount.toFixed(1)} mm`}</p></div>
                </div>
              </div>
            </Card>

            {(rainAlert || heatAlert || severeAlert) && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Weather alerts</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {rainAlert && (
                    <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-sm">
                      <p className="flex items-center gap-2 font-semibold"><Umbrella className="h-4 w-4" />Rain possible</p>
                      <p className="mt-1 text-muted-foreground">Rain or rain probability is shown in the provider forecast.</p>
                    </div>
                  )}
                  {heatAlert && (
                    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                      <p className="flex items-center gap-2 font-semibold"><ThermometerSun className="h-4 w-4" />Heat conditions possible</p>
                      <p className="mt-1 text-muted-foreground">Temperatures of at least 40°C appear in the provider data.</p>
                    </div>
                  )}
                  {severeAlert && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                      <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />{severeAlert.event}</p>
                      <p className="mt-1 text-muted-foreground">{severeAlert.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {weather.daily.length > 0 ? (
              <Card variant="elevated">
                <CardHeader className="pb-2"><CardTitle className="text-base">7-day forecast</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {weather.daily.slice(0, 7).map((day) => (
                    <div key={day.dt} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                      <div>
                        <p className="font-medium">{formatDay(day.dt)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{day.weather?.[0]?.description || "Conditions unavailable"}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-info"><Droplets className="h-3.5 w-3.5" />{Math.round(day.pop * 100)}%</span>
                        <span className="font-semibold">{Math.round(day.temp.max)}° / {Math.round(day.temp.min)}°</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="p-5 text-center text-muted-foreground">7-day forecast data is not available.</CardContent></Card>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Forecast information is provided by the weather service and may change. It does not guarantee weather or agricultural outcomes.
            </p>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Weather;
