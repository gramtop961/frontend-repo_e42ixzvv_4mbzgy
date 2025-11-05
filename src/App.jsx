import { useCallback, useMemo, useState } from 'react';
import LocationAccess from './components/LocationAccess';
import WeatherDetails from './components/WeatherDetails';
import AlertsPrecautions from './components/AlertsPrecautions';
import HealthInfo from './components/HealthInfo';

function GradientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden>
      <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blue-200/50 blur-2xl" />
      <div className="absolute top-1/3 -right-10 h-80 w-80 rounded-full bg-emerald-200/50 blur-2xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-200/50 blur-2xl" />
    </div>
  );
}

export default function App() {
  const [coords, setCoords] = useState(null);
  const [place, setPlace] = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const [healthAlert, setHealthAlert] = useState(null);

  const onLocation = useCallback((c) => setCoords(c), []);
  const onPlaceResolved = useCallback((p) => setPlace(p), []);
  const onWeatherHazards = useCallback((a) => setWeatherAlert(a), []);
  const onHealthHazards = useCallback((a) => setHealthAlert(a), []);

  const headerTitle = useMemo(() => {
    if (!place) return 'Weather & Health Safety';
    return `${place.name || 'Your area'}${place.admin1 ? `, ${place.admin1}` : ''} · ${place.country}`;
  }, [place]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <GradientBackdrop />
      <header className="relative">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{headerTitle}</h1>
          <p className="text-slate-600 mt-1">Real-time weather updates, danger alerts, and regional health advisories — all free.</p>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-12 space-y-5">
        <LocationAccess onLocation={onLocation} />
        <div className="grid md:grid-cols-2 gap-5">
          <WeatherDetails coords={coords} onPlaceResolved={onPlaceResolved} onHazards={onWeatherHazards} />
          <HealthInfo place={place} onHealthHazards={onHealthHazards} />
        </div>
        <AlertsPrecautions weatherAlerts={weatherAlert ? [weatherAlert] : []} healthAlerts={healthAlert ? [healthAlert] : []} />
      </main>

      <footer className="relative mx-auto max-w-5xl px-4 pb-8">
        <p className="text-xs text-slate-500">Sources: Open-Meteo (weather), open-meteo geocoding, disease.sh (COVID-19). No paid APIs are used.</p>
      </footer>
    </div>
  );
}
