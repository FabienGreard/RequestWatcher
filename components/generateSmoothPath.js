// The smoothing ratio
let smoothing = 0.2;

const line = (pointA, pointB) => {
  const lengthX = pointB[0] - pointA[0];
  const lengthY = pointB[1] - pointA[1];
  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX),
  };
};

const controlPoint = (smoothing, current, previous, next, reverse) => {
  const p = previous || current;
  const n = next || current;

  const o = line(p, n);

  const angle = o.angle + (reverse ? Math.PI : 0);
  const length = o.length * smoothing;

  const x = current[0] + Math.cos(angle) * length;
  const y = current[1] + Math.sin(angle) * length;
  return [x, current[1] > 0 ? y : 0];
};

const bezierCommand = (point, i, a, smoothing) => {
  const cps = controlPoint(smoothing, a[i - 1], a[i - 2], point);
  const cpe = controlPoint(smoothing, point, a[i - 1], a[i + 1], true);
  return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
};

const svgPath = (points, command, smoothing) => {
  return points.reduce(
    (acc, point, i, a) =>
      i === 0
        ? `M ${point[0]},${point[1]}`
        : `${acc} ${command(point, i, a, smoothing)}`,
    ''
  );
};

module.exports = (points, smoothing = 'none') => {
  /* We endup to make this experimental, so this function should be rebuild */

  switch (smoothing) {
    case 'rough':
      smoothing = 0.2;
      break;
    case 'gentle':
      smoothing = 0.4;
      break;
    case 'curvy':
      smoothing = 0.6;
      break;
    default:
      smoothing = 0;
      break;
  }

  return svgPath(points, bezierCommand, smoothing);
};
