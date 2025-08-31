import { useState } from 'react';
import BirthForm from './components/BirthForm.jsx';
import Chart from './components/Chart.jsx';
import ChartSummary from './components/ChartSummary.jsx';
import calculateChart from './calculateChart.js';

export default function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (form) => {
    setLoading(true);
    setError('');
    setChartData(null);
    try {
      const data = await calculateChart(form);
      setChartData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate chart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-10 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <BirthForm onSubmit={handleSubmit} loading={loading} />
        {loading && (
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <div role="alert" className="text-red-400">
            {error}
          </div>
        )}
        {chartData && !loading && (
          <div>
            <Chart data={chartData} />
            <ChartSummary data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
}
