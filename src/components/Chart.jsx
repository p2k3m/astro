import React from 'react';
import PropTypes from 'prop-types';
import {
  CHART_PATHS,
  HOUSE_POLYGONS,
  HOUSE_BBOXES,
  HOUSE_CENTROIDS,
  getSignLabel,
} from '../lib/astro.js';

const PLANET_ABBR = {
  sun: 'Su',
  moon: 'Mo',
  mars: 'Ma',
  mercury: 'Me',
  jupiter: 'Ju',
  venus: 'Ve',
  saturn: 'Sa',
  rahu: 'Ra',
  ketu: 'Ke',
};

export default function Chart({
  data,
  children,
  useAbbreviations = false,
  size = 360,
}) {
  if (
    !data ||
    !Array.isArray(data.signInHouse) ||
    data.signInHouse.length !== 13
  ) {
    return (
      <div className="backdrop-blur-md bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-center">
        <span>Invalid chart data</span>
      </div>
    );
  }
  const signInHouse = data.signInHouse;

  const planetByHouse = {};
  data.planets.forEach((p) => {
    const houseIdx = p.house;
    if (houseIdx === undefined) return;

    const baseAbbr = PLANET_ABBR[p.name.toLowerCase()] || p.name.slice(0, 2);
    const flags = [];
    if (p.retro) flags.push('(R)');
    if (p.combust) flags.push('(C)');
    if (p.exalted) flags.push('(Ex)');
    const abbr = baseAbbr + flags.join('');

    planetByHouse[houseIdx] = planetByHouse[houseIdx] || [];
    planetByHouse[houseIdx].push(abbr);
  });

  const SIGN_PAD_X = 0.04;
  const SIGN_FONT_SIZE = 0.05;
  const PLANET_GAP = 0.02;
  const PLANET_PAD = 0.02;
  // Ensure sign numbers sit comfortably inside each polygon even when the
  // chart is rendered at smaller sizes.
  const SIGN_MARGIN = 0.1;

  const houses = HOUSE_POLYGONS.map((poly, idx) => {
    const bbox = HOUSE_BBOXES[idx];
    const centroid = HOUSE_CENTROIDS[idx];
    const { minX, maxX, minY, maxY } = bbox;
    // Start label coordinates at the polygon centroid and clamp to provide
    // a bit of breathing room from the edges of the house.
    let signX = centroid.cx;
    let labelY = centroid.cy;
    if (signX < minX + SIGN_MARGIN) signX = minX + SIGN_MARGIN;
    if (signX > maxX - SIGN_MARGIN) signX = maxX - SIGN_MARGIN;
    if (labelY < minY + SIGN_MARGIN) labelY = minY + SIGN_MARGIN;
    if (labelY > maxY - SIGN_MARGIN) labelY = maxY - SIGN_MARGIN;

    const maxPolyY = Math.max(...poly.map((pt) => pt[1]));
    const cx = centroid.cx;
    const cy = centroid.cy;
    const houseNum = idx + 1;
    const signNum = signInHouse[houseNum] ?? houseNum;
    const planets = planetByHouse[houseNum] || [];
    const signBottom = labelY + SIGN_FONT_SIZE / 2;
    const bottomLimit = maxPolyY - PLANET_PAD;
    let px = cx;
    let py = signBottom + PLANET_GAP;
    const baseline = cy + 0.07;
    const shiftAway = () => {
      const shift = 0.06;
      px =
        signX < cx
          ? Math.min(maxX - PLANET_PAD, cx + shift)
          : Math.max(minX + PLANET_PAD, cx - shift);
    };
    if (py > bottomLimit) {
      py = baseline;
      shiftAway();
    }
    let step = 0;
    if (planets.length > 1) {
      const available = bottomLimit - py;
      step = available > 0 ? Math.min(0.04, available / (planets.length - 1)) : 0;
      if (step < PLANET_GAP) shiftAway();
    }
    return {
      houseNum,
      signNum,
      signX,
      signY: labelY,
      ascX: minX + SIGN_PAD_X,
      planets,
      cx: px,
      pyStart: py,
      step,
    };
  });

  return (
    <div className="backdrop-blur-md bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 1 1"
          className="absolute inset-0 text-amber-600"
          fill="none"
          stroke="currentColor"
        >
          <path d={CHART_PATHS.outer} strokeWidth={0.02} />
          {CHART_PATHS.diagonals.map((d, idx) => (
            <path key={`diag-${idx}`} d={d} strokeWidth={0.01} />
          ))}
          <path d={CHART_PATHS.inner} strokeWidth={0.01} />
        </svg>
        {/** Sign labels */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {houses.map(({ houseNum, signNum, signX, signY, ascX }) => (
            <React.Fragment key={`sign-${houseNum}`}>
              <div
                className="absolute text-amber-700 font-bold text-[clamp(0.9rem,1.5vw,1.2rem)] leading-none"
                style={{
                  top: signY * size,
                  left: signX * size,
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {getSignLabel(signNum - 1, { useAbbreviations })}
              </div>
              {houseNum === 1 && (
                <div
                  className="absolute text-amber-700 text-[0.7rem] font-semibold leading-none"
                  style={{
                    top: signY * size,
                    left: ascX * size,
                    transform: 'translate(0, -50%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Asc
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {/** Planet labels */}
        <div className="absolute inset-0 z-0">
          {houses.map(({ houseNum, planets, cx, pyStart, step }) =>
            planets.map((abbr, i) => (
              <div
                key={`p-${houseNum}-${i}`}
                className="absolute text-amber-900 font-medium text-[clamp(0.55rem,0.75vw,0.85rem)]"
                style={{
                  top: (pyStart + step * i) * size,
                  left: cx * size,
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap',
                }}
              >
                {abbr}
              </div>
            ))
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

Chart.propTypes = {
  data: PropTypes.shape({
    ascSign: PropTypes.number.isRequired,
    signInHouse: PropTypes.arrayOf(PropTypes.number).isRequired,
    planets: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        sign: PropTypes.number,
        house: PropTypes.number.isRequired,
        deg: PropTypes.number,
        min: PropTypes.number,
        sec: PropTypes.number,
        retro: PropTypes.bool,
        combust: PropTypes.bool,
        exalted: PropTypes.bool,
      })
    ).isRequired,
  }).isRequired,
  children: PropTypes.node,
  useAbbreviations: PropTypes.bool,
  size: PropTypes.number,
};
