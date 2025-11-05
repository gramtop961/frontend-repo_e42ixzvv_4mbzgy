export default function AlertsPrecautions({ weatherAlerts = [], healthAlerts = [] }) {
  const combined = [
    ...weatherAlerts,
    ...healthAlerts,
  ];

  const uniqueHazards = Array.from(new Set(combined.flatMap(a => a.hazards || [])));
  const uniquePrecautions = Array.from(new Set(combined.flatMap(a => a.precautions || [])));

  return (
    <div className="w-full bg-white/70 backdrop-blur rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-semibold text-slate-800">Alerts & Precautions</h3>

      {uniqueHazards.length === 0 ? (
        <p className="text-sm text-slate-600 mt-2">No active alerts for your area right now. Stay safe!</p>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Current Alerts</p>
            <ul className="mt-2 grid gap-2 md:grid-cols-2">
              {uniqueHazards.map((h, i) => (
                <li key={i} className="text-sm bg-red-50 border border-red-100 text-red-800 px-3 py-2 rounded-lg">{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Safety Precautions</p>
            <ul className="mt-2 grid gap-2 md:grid-cols-2">
              {uniquePrecautions.map((p, i) => (
                <li key={i} className="text-sm bg-amber-50 border border-amber-100 text-amber-800 px-3 py-2 rounded-lg">{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
