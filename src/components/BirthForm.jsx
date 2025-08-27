import { useState, useEffect } from 'react';

// Replace GEOAPIFY_API_KEY with your actual API key in a .env file.
const GEOAPIFY_API_KEY = 'YOUR_API_KEY_HERE';

export default function BirthForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    place: '',
    lat: null,
    lon: null,
  });
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (form.place.length < 3) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(form.place)}&limit=5&apiKey=${GEOAPIFY_API_KEY}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => setSuggestions(data.features || []))
      .catch(() => {});
    return () => controller.abort();
  }, [form.place]);

  const handleSelect = (feature) => {
    setForm({
      ...form,
      place: feature.properties.formatted,
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
    });
    setSuggestions([]);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const valid = form.name && form.date && form.time && form.lat !== null && form.lon !== null;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit(form);
  };

  const buttonClasses = [
    'w-full',
    'py-2',
    'rounded',
    'bg-gradient-to-r from-yellow-400 to-orange-500',
    'text-slate-900 font-semibold',
    'disabled:opacity-50',
  ].join(' ');

  return (
    <form
      onSubmit={submit}
      className="space-y-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6"
    >
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500">
        Vedic Chart Generator
      </h1>
      <div>
        <label className="block mb-1">Full Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 rounded bg-slate-800 border border-slate-700"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-2 rounded bg-slate-800 border border-slate-700"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Time of Birth</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full p-2 rounded bg-slate-800 border border-slate-700"
            required
          />
        </div>
      </div>
      <div className="relative">
        <label className="block mb-1">Place of Birth</label>
        <input
          type="text"
          name="place"
          value={form.place}
          onChange={handleChange}
          className="w-full p-2 rounded bg-slate-800 border border-slate-700"
          required
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-slate-800 border border-slate-700 w-full mt-1 max-h-40 overflow-auto rounded">
            {suggestions.map((sug) => (
              <li
                key={sug.properties.place_id}
                className="p-2 hover:bg-slate-700 cursor-pointer"
                onClick={() => handleSelect(sug)}
              >
                {sug.properties.formatted}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit" disabled={!valid || loading} className={buttonClasses}>
        {loading ? 'Calculating...' : 'Generate Chart'}
      </button>
    </form>
  );
}
