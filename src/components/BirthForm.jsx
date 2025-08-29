import { useState, useEffect } from 'react';
import { searchPlaces } from '../lib/offlineGeocoder';
import { parseDateInput, parseTimeInput, monthFirst } from '../lib/parseDateTime';

export default function BirthForm({ onSubmit, loading }) {
  const locale = navigator.language || 'en-US';
  const [form, setForm] = useState({
    name: '',
    dateInput: '',
    timeInput: '',
    ampm: 'AM',
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
    let active = true;
    searchPlaces(form.place).then((results) => {
      if (active) setSuggestions(results);
    });
    return () => {
      active = false;
    };
  }, [form.place]);

  const handleSelect = (item) => {
    setForm({
      ...form,
      place: item.name,
      lat: item.lat,
      lon: item.lon,
    });
    setSuggestions([]);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const parsedDate = parseDateInput(form.dateInput, locale);
  const parsedTime = parseTimeInput(form.timeInput, form.ampm);
  const iso = parsedDate && parsedTime ? `${parsedDate}T${parsedTime}` : '';
  const dateError = form.dateInput && !parsedDate ? 'Invalid date' : '';
  const timeError = form.timeInput && !parsedTime ? 'Invalid time' : '';

  const valid =
    form.name && parsedDate && parsedTime && form.lat !== null && form.lon !== null;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      name: form.name,
      date: parsedDate,
      time: parsedTime,
      place: form.place,
      lat: form.lat,
      lon: form.lon,
    });
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
            type="text"
            name="dateInput"
            placeholder={monthFirst(locale) ? 'MM-DD-YYYY' : 'DD-MM-YYYY'}
            value={form.dateInput}
            onChange={handleChange}
            className="w-full p-2 rounded bg-slate-800 border border-slate-700"
            required
          />
          {dateError && <p className="text-red-400 text-sm mt-1">{dateError}</p>}
        </div>
        <div>
          <label className="block mb-1">Time of Birth</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="timeInput"
              placeholder="HH:MM"
              value={form.timeInput}
              onChange={handleChange}
              className="w-full p-2 rounded bg-slate-800 border border-slate-700"
              required
            />
            <select
              name="ampm"
              value={form.ampm}
              onChange={handleChange}
              className="p-2 rounded bg-slate-800 border border-slate-700"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          {timeError && <p className="text-red-400 text-sm mt-1">{timeError}</p>}
        </div>
      </div>
      {iso && (
        <div>
          <label className="block mb-1">Resolved Date-Time (ISO)</label>
          <input
            type="text"
            value={iso}
            readOnly
            className="w-full p-2 rounded bg-slate-800 border border-slate-700"
          />
        </div>
      )}
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
            {suggestions.map((sug, idx) => (
              <li
                key={idx}
                className="p-2 hover:bg-slate-700 cursor-pointer"
                onClick={() => handleSelect(sug)}
              >
                {sug.name}
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
