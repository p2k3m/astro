import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { DateTime } from 'luxon';
import { searchPlaces } from '../lib/offlineGeocoder';
import { parseTimeInput, monthFirst } from '../lib/parseDateTime';

export default function BirthForm({ onSubmit, loading }) {
  const locale = navigator.language || 'en-US';
  const [form, setForm] = useState({
    name: '',
    date: null,
    time: null,
    place: '',
    lat: null,
    lon: null,
    timezone: 'Asia/Kolkata',
  });
  const [suggestions, setSuggestions] = useState([]);
  const timezones = Intl.supportedValuesOf('timeZone');

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

  const parsedDate = form.date ? DateTime.fromJSDate(form.date).toISODate() : null;
  const timeStr = form.time ? DateTime.fromJSDate(form.time).toFormat('hh:mm') : '';
  const ampm = form.time ? DateTime.fromJSDate(form.time).toFormat('a') : 'AM';
  const parsedTime = timeStr ? parseTimeInput(timeStr, ampm) : null;
  const resolved =
    parsedDate && parsedTime
      ? `${DateTime.fromISO(`${parsedDate}T${parsedTime}`, {
          zone: form.timezone,
        }).toISO({ suppressMilliseconds: true })} [${form.timezone}]`
      : '';
  const dateError = '';
  const timeError = form.time && !parsedTime ? 'Invalid time' : '';

  const valid =
    form.name &&
    parsedDate &&
    parsedTime &&
    form.lat !== null &&
    form.lon !== null &&
    form.timezone;

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
      timezone: form.timezone,
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
          <DatePicker
            selected={form.date}
            onChange={(date) => setForm({ ...form, date })}
            placeholderText={monthFirst(locale) ? 'MM-DD-YYYY' : 'DD-MM-YYYY'}
            dateFormat={monthFirst(locale) ? 'MM-dd-yyyy' : 'dd-MM-yyyy'}
            className="w-full p-2 rounded bg-slate-800 border border-slate-700"
            wrapperClassName="w-full"
          />
          {dateError && <p className="text-red-400 text-sm mt-1">{dateError}</p>}
        </div>
        <div>
          <label className="block mb-1">Time of Birth</label>
          <DatePicker
            selected={form.time}
            onChange={(date) => setForm({ ...form, time: date })}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={1}
            timeCaption="Time"
            dateFormat="hh:mm aa"
            placeholderText="HH:MM AM"
            className="w-full p-2 rounded bg-slate-800 border border-slate-700"
            wrapperClassName="w-full"
          />
          {timeError && <p className="text-red-400 text-sm mt-1">{timeError}</p>}
        </div>
      </div>
      {resolved && (
        <div>
          <label className="block mb-1">Resolved Date-Time (ISO)</label>
          <input
            type="text"
            value={resolved}
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
      <div>
        <label className="block mb-1">Timezone</label>
        <select
          name="timezone"
          value={form.timezone}
          onChange={handleChange}
          className="w-full p-2 rounded bg-slate-800 border border-slate-700"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={!valid || loading} className={buttonClasses}>
        {loading ? 'Calculating...' : 'Generate Chart'}
      </button>
    </form>
  );
}

