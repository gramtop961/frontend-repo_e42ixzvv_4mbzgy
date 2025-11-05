import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

export default function LocationAccess({ onLocation }) {
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied
  const [error, setError] = useState('');

  useEffect(() => {
    // Try to use previously saved coords
    try {
      const saved = localStorage.getItem('user_coords');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.lat && parsed.lon) {
          onLocation({ lat: parsed.lat, lon: parsed.lon });
          setStatus('granted');
        }
      }
    } catch (_) {}
  }, [onLocation]);

  const requestLocation = () => {
    if (!('geolocation' in navigator)) {
      setStatus('denied');
      setError('Geolocation is not supported on this device.');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = { lat: latitude, lon: longitude };
        localStorage.setItem('user_coords', JSON.stringify(coords));
        setStatus('granted');
        onLocation(coords);
      },
      (err) => {
        setStatus('denied');
        setError(err.message || 'Location access denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="w-full bg-white/70 backdrop-blur rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><MapPin size={20} /></div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Your Location</h3>
          <p className="text-sm text-slate-600">Allow access to get hyper-local weather and health alerts for your area.</p>
          <div className="mt-3">
            <button
              onClick={requestLocation}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              {status === 'requesting' ? 'Requesting…' : 'Enable Location'}
            </button>
          </div>
          {status === 'denied' && (
            <p className="text-xs text-red-600 mt-2">{error || 'Unable to access your location.'}</p>
          )}
          {status === 'granted' && (
            <p className="text-xs text-emerald-700 mt-2">Location enabled ✔</p>
          )}
        </div>
      </div>
    </div>
  );
}
