export default function Chart({ data }) {
  const positions = {
    1: { x: 2, y: 0 },
    2: { x: 3, y: 1 },
    3: { x: 3, y: 2 },
    4: { x: 2, y: 3 },
    5: { x: 1, y: 3 },
    6: { x: 0, y: 2 },
    7: { x: 0, y: 1 },
    8: { x: 1, y: 0 },
    9: { x: 1, y: 1 },
    10: { x: 2, y: 1 },
    11: { x: 2, y: 2 },
    12: { x: 1, y: 2 },
  };

  const planetByHouse = {};
  data.planets.forEach((p) => {
    planetByHouse[p.house] = planetByHouse[p.house] || [];
    planetByHouse[p.house].push(
      `${p.abbr} ${p.degree}°${p.retrograde ? ' R' : ''}${p.combust ? ' C' : ''}`
    );
  });

  const size = 300; // chart size
  const cell = size / 3;

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-center">
      <div
        className="relative"
        style={{ width: size, height: size }}
    >
      {/* outer square */}
      <div className="absolute inset-0 rotate-45 border-2 border-orange-500" />
      {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
        const pos = positions[house];
        return (
          <div
            key={house}
            className="absolute border border-orange-500 flex flex-col items-center justify-center text-xs"
            style={{
              top: pos.y * (cell / size) * 100 + '%',
              left: pos.x * (cell / size) * 100 + '%',
              transform: 'rotate(45deg)',
              width: cell,
              height: cell,
            }}
          >
            <div className="-rotate-45 flex flex-col items-center">
              <span className="text-yellow-300 font-semibold">
                {data.houses[house - 1]}
              </span>
              {planetByHouse[house] &&
                planetByHouse[house].map((pl, idx) => (
                  <span key={idx}>{pl}</span>
                ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
