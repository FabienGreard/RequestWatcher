const { htm } = require('@zeit/integration-utils');
const { colors } = require('../theme.js');

const generateAxes = ({ WIDTH, HEIGHT, dataMax, dateStart, dateEnd }) => {
  const widthBase = Math.round(WIDTH / 6);
  const heightBase = Math.round(HEIGHT / 1.2);
  const fontSize = Math.min(Math.floor(HEIGHT / 10), Math.floor(width / 20));
  return `<g>
    <line
      x1="${widthBase}"
      y1="0"
      x2="${widthBase}"
      y2="${heightBase}"
      stroke="${colors.red}"
    />
    <text x="${10}" y="${heightBase}" >
      0
    </text>
    <text x="${10}" y="${(2 * HEIGHT) / 1.2 / 11}" >
      ${dataMax}
    </text>
  </g>
  <g>
    <line
      x1="${widthBase}"
      y1="${heightBase}"
      x2="${WIDTH}"
      y2="${heightBase}"
      stroke="${colors.red}"
    />
    <text x="${widthBase}" y="${HEIGHT}" >
      ${dateStart}
    </text>
    <text
      x="${WIDTH - 75}"
      y="${HEIGHT}"
    >
      ${dateEnd}
    </text>
  </g>`;
};

const generateGraphWithSpace = ({
  WIDTH,
  HEIGHT,
  dataMax,
  dateStart,
  dateEnd,
  data,
}) => {
  const widthBase = Math.round(WIDTH / 6);
  const heightBase = Math.round(HEIGHT / 1.2);
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<?xml version="1.0" encoding="utf-8"?>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 132">
    <path
      d="M ${widthBase} ${heightBase} L ${data
        .map((value, index) =>
          [
            widthBase + index * 10,
            ((HEIGHT / 1.2) * (1 + (10 * (dataMax - value)) / dataMax)) / 11,
          ]
            .map(elt => Math.round(elt))
            .join(',')
        )
        .join(' L ')} L ${widthBase + (data.length - 1) * 10} ${heightBase}"
      fill="${colors.green}"
    />
    ${generateAxes({ WIDTH, HEIGHT, dataMax, dateStart, dateEnd })}
  </svg>`
    )
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')
  );
};

generateGraph = ({ HEIGHT, dataMax, dateStart, dateEnd, data }) =>
  generateGraphWithSpace({
    WIDTH: data.length * 10 * 1.2,
    HEIGHT: HEIGHT * 1.1 * 1.2,
    dataMax,
    dateStart,
    dateEnd,
    data,
  });

module.exports = {
  generateAxes,
  generateGraphWithSpace,
  generateGraph,
};
