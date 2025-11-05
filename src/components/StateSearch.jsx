import { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Thermometer, Wind, CloudRain } from 'lucide-react';

function ResultItem({ item, onSelect }) {
  const label = useMemo(() => {
    const parts = [item.name, item.admin1, item.country];
    return parts.filter(Boolean).join(', ');
  }, [item]);

  return (
    <button
      onClick={() => onSelect(item)}
      className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-md flex items-center gap-2"
    >
      <MapPin className="h-4 w-4 text-slate-500" />
      <span className="text-sm text-slate-700">{label}</span>
    </button>
  );
}

function WeatherCard({ place }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const params = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          current: [
            'temperature_2m',
            'relative_humidity_2m',
            'precipitation',
            'wind_speed_10m'
          ].join(','),
          timezone: 'auto',
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load weather');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError(e.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    if (place) run();
  }, [place]);

  const header = useMemo(() => {
    if (!place) return '';
    const parts = [place.name, place.admin1, place.country];
    return parts.filter(Boolean).join(', ');
  }, [place]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{header}</h3>
          <p className="text-xs text-slate-500">Live weather snapshot</p>
        </div>
      </div>
      <div className="mt-4">
        {loading && <p className="text-sm text-slate-600">Loading weather…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <Thermometer className="h-4 w-4 text-rose-500" />
              <div>
                <p className="text-xs text-slate-500">Temperature</p>
                <p className="font-medium text-slate-800">{data.current?.temperature_2m}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <CloudRain className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">Precipitation</p>
                <p className="font-medium text-slate-800">{data.current?.precipitation} mm</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <Wind className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500">Wind</p>
                <p className="font-medium text-slate-800">{data.current?.wind_speed_10m} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <Thermometer className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-slate-500">Humidity</p>
                <p className="font-medium text-slate-800">{data.current?.relative_humidity_2m}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StateSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  async function search(q) {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        name: q.trim(),
        country: 'IN',
        count: '10',
        language: 'en',
        format: 'json',
      });
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to search locations');
      const json = await res.json();
      const filtered = (json.results || []).filter((r) => r.country_code === 'IN');
      setResults(filtered);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => search(query), 350);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur p-4">
        <label className="block text-sm font-medium text-slate-700">Search Indian states or cities</label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type e.g. Andhra Pradesh, Karnataka, Mumbai…"
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
          />
        </div>
        {loading && <p className="mt-2 text-sm text-slate-600">Searching…</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {!loading && results.length > 0 && (
          <div className="mt-2 max-h-64 overflow-auto rounded-md border border-slate-200">
            {results.map((r) => (
              <ResultItem key={`${r.id}-${r.latitude}-${r.longitude}`} item={r} onSelect={(it) => { setSelected(it); setResults([]); setQuery(`${it.name}${it.admin1 ? `, ${it.admin1}` : ''}`); }} />
            ))}
          </div>
        )}
        {(!loading && results.length === 0 && query.length >= 2 && !error) && (
          <p className="mt-2 text-xs text-slate-500">No matches. Try a different spelling.</p>
        )}
      </div>

      {selected && <WeatherCard place={selected} />}
    </div>
  );
}
