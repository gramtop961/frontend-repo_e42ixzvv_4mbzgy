import { useEffect, useMemo, useState } from 'react';
import { Thermometer, Wind, CloudRain, AlertTriangle } from 'lucide-react';

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/reverse';

function assessWeatherHazards(current) {
  if (!current) return { hazards: [], precautions: [] };
  const hazards = [];
  const precautions = new Set();

  const t = current.temperature_2m; // °C
  const rh = current.relative_humidity_2m; // %
  const rain = current.precipitation; // mm
  const wind = current.wind_speed_10m; // km/h or m/s depending on API
  const code = current.weather_code; // WMO code

  // Heat risk
  if (t >= 38) {
    hazards.push('Extreme heat risk');
    precautions.add('Stay indoors and keep hydrated');
    precautions.add('Avoid strenuous outdoor activities');
    precautions.add('Check on elderly and vulnerable people');
  } else if (t >= 32) {
    hazards.push('High heat');
    precautions.add('Drink water frequently');
    precautions.add('Wear light, breathable clothing');
  }

  // Heavy rain / flood proxy
  if (rain >= 10 || [65, 66, 67, 80, 81, 82].includes(code)) {
    hazards.push('Heavy rain');
    precautions.add('Avoid driving through flooded areas');
    precautions.add('Keep emergency kit ready');
    precautions.add('Stay indoors if possible');
  }

  // Stormy / high wind
  if (wind >= 20 || [95, 96, 99].includes(code)) {
    hazards.push('Storm / high wind');
    precautions.add('Secure outdoor objects');
    precautions.add('Stay away from trees and power lines');
    precautions.add('Delay travel if possible');
  }

  // Cold stress
  if (t <= 0) {
    hazards.push('Freezing conditions');
    precautions.add('Wear layered, warm clothing');
    precautions.add('Beware of ice on roads and pavements');
  }

  // Humidity + heat advisory
  if (t >= 30 && rh >= 70) {
    hazards.push('Heat + high humidity');
    precautions.add('Use fans/AC and take cool showers');
  }

  return { hazards: Array.from(new Set(hazards)), precautions: Array.from(precautions) };
}

export default function WeatherDetails({ coords, onPlaceResolved, onHazards }) {
  const [place, setPlace] = useState(null);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const url = useMemo(() => {
    if (!coords) return null;
    const params = new URLSearchParams({
      latitude: String(coords.lat),
      longitude: String(coords.lon),
      timezone: 'auto',
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m'
    });
    return `${WEATHER_API}?${params.toString()}`;
  }, [coords]);

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      if (!coords) return;
      setLoading(true);
      setError('');
      try {
        const [wRes, gRes] = await Promise.all([
          fetch(url),
          fetch(`${GEO_API}?latitude=${coords.lat}&longitude=${coords.lon}&language=en`)
        ]);
        if (!wRes.ok) throw new Error('Failed to fetch weather');
        if (!gRes.ok) throw new Error('Failed to resolve place');
        const wData = await wRes.json();
        const gData = await gRes.json();
        if (cancelled) return;
        const c = wData.current;
        setCurrent(c);
        const best = gData && gData.results && gData.results[0];
        const resolved = best ? {
          name: best.name,
          admin1: best.admin1,
          country: best.country,
          country_code: best.country_code
        } : null;
        setPlace(resolved);
        onPlaceResolved?.(resolved);
        const { hazards, precautions } = assessWeatherHazards(c);
        onHazards?.({ hazards, precautions, source: 'weather' });
        // Notifications
        if (hazards.length > 0 && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Weather Alert', {
              body: hazards.join(' • '),
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [coords, url, onPlaceResolved, onHazards]);

  return (
    <div className="w-full bg-white/70 backdrop-blur rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Weather</h3>
          {place && (
            <p className="text-sm text-slate-600">{place.name}{place.admin1 ? `, ${place.admin1}` : ''} · {place.country}</p>
          )}
        </div>
        <div className="text-amber-600"><AlertTriangle size={20} /></div>
      </div>

      {loading && <p className="text-sm text-slate-600 mt-3">Loading current conditions…</p>}
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {current && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 text-blue-700"><Thermometer size={18} /><span className="text-sm font-medium">Temperature</span></div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{Math.round(current.temperature_2m)}°C</div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50">
            <div className="flex items-center gap-2 text-emerald-700"><CloudRain size={18} /><span className="text-sm font-medium">Precipitation</span></div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{current.precipitation?.toFixed(1)} mm</div>
          </div>
          <div className="p-3 rounded-lg bg-orange-50">
            <div className="flex items-center gap-2 text-orange-700"><Wind size={18} /><span className="text-sm font-medium">Wind</span></div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{Math.round(current.wind_speed_10m)} km/h</div>
          </div>
          <div className="p-3 rounded-lg bg-violet-50">
            <div className="flex items-center gap-2 text-violet-700"><Thermometer size={18} /><span className="text-sm font-medium">Humidity</span></div>
            <div className="mt-1 text-2xl font-semibold text-slate-800">{Math.round(current.relative_humidity_2m)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
