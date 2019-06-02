const { htm } = require('@zeit/integration-utils');
const { colors } = require('../theme.js');

const formatValue = value => {
  if (value === 0) return 0;

  const expoIndex = Math.floor(Math.log10(value));
  const index = Math.floor(expoIndex / 3);
  const multi = ['', 'K', 'M', 'B', 'T', 'P'];
  const closerExpo = Math.pow(10, expoIndex - 2);

  return (
    (Math.round(value / closerExpo) * closerExpo) / Math.pow(10, index * 3) +
    multi[index]
  );
};

const formatDate = ts => {
  const date = new Date(ts);

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

const generateAxes = ({ WIDTH, HEIGHT, xRange, xFormat, yRange, yFormat }) => {
  const widthBase = Math.round(WIDTH / 6);
  const heightBase = Math.round(HEIGHT / 1.2);
  const fontSize = Math.min(Math.floor(HEIGHT / 12), Math.floor(WIDTH / 22));
  return `<g>
    <line
      x1="${widthBase}"
      y1="0"
      x2="${widthBase}"
      y2="${heightBase + 5}"
      stroke="#eaeaea"
    />
    ${[1, 2, 3].map(
      val => `<line
      x1="${((WIDTH - widthBase) * val) / 4 + widthBase}"
      y1="0"
      x2="${((WIDTH - widthBase) * val) / 4 + widthBase}"
      y2="${heightBase + 5}"
      stroke="#eaeaea"
      stroke-dasharray="4"
    />`
    )}
    <text x="${40}" y="${heightBase}" font-size="${fontSize}">
      ${yFormat(yRange[0])}
    </text>
    <text x="${40}" y="${(2 * HEIGHT) / 1.2 / 11}" font-size="${fontSize}">
      ${yFormat(yRange[1])}
    </text>
  </g>
  <g>
    <line
      x1="${widthBase - 5}"
      y1="${heightBase}"
      x2="${WIDTH}"
      y2="${heightBase}"
      stroke="#eaeaea"
    />
    ${[1].map(
      val => `<line
      x1="${widthBase - 5}"
      y1="${(heightBase * val) / 2}" 
      x2="${WIDTH}"
      y2="${(heightBase * val) / 2}"
      stroke="#eaeaea"
      stroke-dasharray="4"
    />`
    )}
    <text x="${widthBase}" y="${HEIGHT}" font-size="${fontSize}">
      ${xFormat(xRange[0])}
    </text>
    <text
      x="${WIDTH - 75}"
      y="${HEIGHT}"
      font-size="${fontSize}"
    >
      ${xFormat(xRange[1])}
    </text>
  </g>`;
};

const generateGraphWithSpace = ({
  WIDTH,
  HEIGHT,
  data,
  xRange,
  xFormat,
  yRange,
  yFormat,
}) => {
  const widthBase = Math.round(WIDTH / 6);
  const heightBase = Math.round(HEIGHT / 1.2);
  const dataMax = yRange[1];
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
    ${generateAxes({
      WIDTH,
      HEIGHT,
      xRange,
      xFormat,
      yRange,
      yFormat,
    })}
  </svg>`
    )
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')
  );
};

generateGraph = ({ HEIGHT, data, xRange, xFormat, yRange, yFormat }) =>
  generateGraphWithSpace({
    WIDTH: data.length * 10 * 1.2,
    HEIGHT: HEIGHT * 1.1 * 1.2,
    data,
    xRange,
    xFormat,
    yRange,
    yFormat,
  });

module.exports = {
  generateAxes,
  generateGraphWithSpace,
  generateGraph,
  formatValue,
  formatDate,
};
