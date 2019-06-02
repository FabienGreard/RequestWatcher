const { htm } = require('@zeit/integration-utils');
const { colors } = require('../theme.js');
const generateSmoothPath = require('./generateSmoothPath.js');

const formatValue = value => {
  if (value === 0) return 0;

  const expoIndex = Math.floor(Math.log10(value));
  const index = Math.floor(expoIndex / 3);
  const multi = ['', 'K', 'M', 'B', 'T', 'P'];
  const closerExpo = Math.pow(10, expoIndex - 2);

  return (Math.round(value / closerExpo) * closerExpo) / Math.pow(10, index * 3) + multi[index];
};

const formatDate = ts => {
  const date = new Date(ts);

  return `${date.getDate()}/${date.getMonth() + 1} - ${date.getHours()}h`;
};

const generateStepValue = (range, step, max) => {
  return ((range[1] - range[0]) * step) / max + range[0];
};

const generateAxes = ({ WIDTH, HEIGHT, xRange, xFormat, yRange, yFormat }) => {
  const widthBase = Math.round(WIDTH / 6);
  const heightBase = Math.round(HEIGHT / 1.2);
  const heightPeak = HEIGHT / 1.2 / 11;
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
      x1="${generateStepValue([widthBase, WIDTH], val, 4)}"
      y1="0"
      x2="${generateStepValue([widthBase, WIDTH], val, 4)}"
      y2="${heightBase + 5}"
      stroke="#eaeaea"
      stroke-dasharray="4"
    />`,
    )}
    ${[0, 1, 2].map(
      val => `<text
        x="${widthBase - 30}"
        y="${generateStepValue([heightBase, heightPeak], val, 2)}"
        font-size="${fontSize}"
        text-anchor="end"
        alignment-baseline="middle"
      >
        ${yFormat(generateStepValue(yRange, val, 2))}
      </text>`,
    )}
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
    />`,
    )}
    ${[0, 1, 2, 3, 4]
      .map(val => ({
        x: generateStepValue([widthBase, WIDTH], val, 4),
        value: xFormat(generateStepValue(xRange, val, 4)),
      }))
      .reduce((prev, next, currentIndex, arr) => {
        if (currentIndex === 0) return [next];

        if (currentIndex === arr.length - 1 || arr[currentIndex - 1].value !== next.value)
          prev.push(next);

        return prev;
      }, [])
      .map(
        ({ x, value }) => `<text
        x="${x}"
        y="${HEIGHT}"
        font-size="${fontSize}"
        text-anchor="middle"
      >
        ${value}
      </text>`,
      )}
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
  color = colors.green,
}) => {
  const widthBase = Math.round(WIDTH / 6);
  const heightBase = Math.round(HEIGHT / 1.2);
  const dataMax = yRange[1];
  const points = data.map((value, index) =>
    [widthBase + index * 10, ((HEIGHT / 1.2) * (1 + (10 * (dataMax - value)) / dataMax)) / 11].map(
      elt => Math.round(elt),
    ),
  );
  const allPoints = [];
  allPoints.push([widthBase, heightBase]);
  allPoints.push(...points);
  allPoints.push([widthBase + (data.length - 1) * 10, heightBase]);
  const smoothPath = generateSmoothPath(allPoints);
  return (
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<?xml version="1.0" encoding="utf-8"?>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH * 1.1} ${HEIGHT}">
    <path
      d="${smoothPath}"
      fill="${color}"
    />
    ${generateAxes({
      WIDTH,
      HEIGHT,
      xRange,
      xFormat,
      yRange,
      yFormat,
    })}
  </svg>`,
    )
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')
  );
};

generateGraph = ({ HEIGHT = 120, data, xRange, xFormat, yRange, yFormat, color }) =>
  generateGraphWithSpace({
    WIDTH: data.length * 10 * 1.2,
    HEIGHT: HEIGHT * 1.1 * 1.2,
    data,
    xRange,
    xFormat,
    yRange,
    yFormat,
    color,
  });

module.exports = {
  generateAxes,
  generateGraphWithSpace,
  generateGraph,
  formatValue,
  formatDate,
};
