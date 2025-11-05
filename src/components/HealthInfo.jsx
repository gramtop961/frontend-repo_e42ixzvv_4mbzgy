import { useEffect, useState } from 'react';

const COVID_COUNTRY_URL = (code) => `https://disease.sh/v3/covid-19/countries/${code}?strict=true`;

function covidGuidance() {
  return {
    symptoms: [
      'Fever or chills',
      'Cough, sore throat',
      'Shortness of breath',
      'Loss of taste or smell',
      'Fatigue and body aches',
    ],
    prevention: [
      'Wash hands frequently',
      'Stay home if unwell',
      'Consider mask in crowded indoor spaces',
      'Keep distance from sick individuals',
      'Ensure good ventilation indoors',
    ],
    medicines: [
      'Paracetamol/Acetaminophen for fever (follow label dosing)',
      'Oral rehydration and rest',
      'Seek medical advice for high-risk individuals',
    ],
  };
}

export default function HealthInfo({ place, onHealthHazards }) {
  const [covid, setCovid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchCovid() {
      if (!place?.country_code) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(COVID_COUNTRY_URL(place.country_code));
        if (!res.ok) throw new Error('Failed to fetch health data');
        const data = await res.json();
        if (cancelled) return;
        setCovid(data);
        // Determine if alert-worthy based on new cases per million today
        const today = data.todayCases || 0;
        const pop = data.population || 1;
        const perMillion = Math.round((today / pop) * 1_000_000);
        if (perMillion >= 50) {
          onHealthHazards?.({
            hazards: ['Elevated COVID-19 activity'],
            precautions: [
              'Wear a mask in crowded indoor spaces',
              'Stay home if unwell',
              'Consider testing if symptomatic',
            ],
            source: 'health',
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchCovid();
    return () => { cancelled = true; };
  }, [place, onHealthHazards]);

  const g = covidGuidance();

  return (
    <div className="w-full bg-white/70 backdrop-blur rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-semibold text-slate-800">Health & Medicine</h3>
      {!place && <p className="text-sm text-slate-600 mt-2">Enable location to show relevant health advisories.</p>}
      {loading && <p className="text-sm text-slate-600 mt-2">Loading regional health indicators…</p>}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {covid && (
        <div className="mt-3">
          <p className="text-sm text-slate-700">Latest COVID-19 snapshot for {covid.country}:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <div className="p-3 rounded-lg bg-rose-50">
              <p className="text-xs text-rose-700">Today Cases</p>
              <p className="text-lg font-semibold text-slate-800">{covid.todayCases?.toLocaleString?.() || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50">
              <p className="text-xs text-amber-700">Active</p>
              <p className="text-lg font-semibold text-slate-800">{covid.active?.toLocaleString?.() || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <p className="text-xs text-blue-700">Tests</p>
              <p className="text-lg font-semibold text-slate-800">{covid.tests?.toLocaleString?.() || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50">
              <p className="text-xs text-emerald-700">Population</p>
              <p className="text-lg font-semibold text-slate-800">{covid.population?.toLocaleString?.() || '—'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid md:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-sm font-medium text-slate-700">Symptoms</p>
          <ul className="mt-2 space-y-1">
            {g.symptoms.map((s, i) => (
              <li key={i} className="text-sm text-slate-700">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-sm font-medium text-slate-700">Preventive measures</p>
          <ul className="mt-2 space-y-1">
            {g.prevention.map((s, i) => (
              <li key={i} className="text-sm text-slate-700">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-sm font-medium text-slate-700">Common medicines (info only)</p>
          <ul className="mt-2 space-y-1">
            {g.medicines.map((s, i) => (
              <li key={i} className="text-sm text-slate-700">• {s}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mt-4">This section is informational and not a medical prescription. Consult local health authorities for official guidance.</p>
    </div>
  );
}
