const chart = require('asciichart');
const { htm } = require('@zeit/integration-utils');
const { AverageBox, Graph } = require('../components');

const durationRegex = /Duration:\s([0-9.]+)\sms/;
const billedDurationRegex = /Billed Duration:\s([0-9.]+)\sms/;
const memorySizeRegex = /Memory Size:\s([0-9.]+)\sMB/;
const maxMemoryUsedRegex = /Max Memory Used:\s([0-9.]+)\sMB/;

const getMatchedValue = (text, regex) => {
  const matched = text.match(regex);

  return matched ? parseFloat(matched[1]) : undefined;
};

const formatEvent = ({ type, created, payload }) => ({
  type,
  created,
  info: payload.info,
  duration: getMatchedValue(payload.text, durationRegex),
  billedDuration: getMatchedValue(payload.text, billedDurationRegex),
  memorySize: getMatchedValue(payload.text, memorySizeRegex),
  maxMemoryUsed: getMatchedValue(payload.text, maxMemoryUsedRegex),
});

const sumOf = (arr, key) => {
  const filteredArr = arr.filter(elt => elt[key] !== undefined);

  return filteredArr.reduce((prev, next) => prev + next[key], 0);
};

const render = ({ deploymentEvents, clientState }) => {
  const errorEvent = deploymentEvents
    .filter(({ type }) => type === 'stderr')
    .map(formatEvent);

  const normalEvent = deploymentEvents.filter(({ type }) => type !== 'stderr');
  const buildEvent = normalEvent
    .filter(
      ({
        payload: {
          info: { type },
        },
      }) => type === 'build'
    )
    .map(formatEvent);
  const outputEvent = normalEvent
    .filter(
      ({
        payload: {
          info: { type },
        },
      }) => type === 'output'
    )
    .map(formatEvent);

  const allEvent = [...errorEvent, ...buildEvent, ...outputEvent];

  const uid = deploymentEvents[0].payload.deploymentId;
  const action = 'overview/' + uid;

  const NB_POINT = 50;
  const start = allEvent[0].created;
  const end = allEvent[allEvent.length - 1].created + 1;
  const step = Math.max((end - start) / NB_POINT, 0.000000000000000000000001);
  allBatchedEvent = Array(NB_POINT)
    .fill(0)
    .map((_, index) =>
      sumOf(
        allEvent.filter(
          elt =>
            elt.created < start + (index + 1) * step &&
            elt.created >= start + index * step
        ),
        'duration'
      )
    );
  const dataMax = Math.max(...allBatchedEvent);

  const graph = Graph.generateGraph({
    HEIGHT: 100,
    dataMax: dataMax,
    dateStart: new Date(start).toDateString(),
    dateEnd: new Date(end).toDateString(),
    data: allBatchedEvent,
  });

  return htm`<Box display="flex" justifyContent="space-arround">
   ${AverageBox(allEvent, 'duration', 'Average Duration', 'MS')}
   ${AverageBox(allEvent, 'billedDuration', 'Average Billed Duration', 'MS')}
   ${AverageBox(allEvent, 'memorySize', 'Average Memory size', 'MB')}
   ${AverageBox(allEvent, 'maxMemoryUsed', 'Average Memory Used', 'MB')}</Box>
   <Box 
      backgroundColor="#fff" 
      backgroundImage=${`url(${graph})`}
      backgroundSize="contain"
      backgroundRepeat="no-repeat"
      backgroundPosition="center"
      width="100%"  
      height="250px"
      borderRadius="10px" 
      border="1px solid #eaeaea" 
      padding="10px"
      margin="20px 0"
      />
  `;
};

const fetch = async ({ zeitClient, deploymentId }) => {
  const eventsResponse = await zeitClient.fetch(
    `/v2/now/deployments/${deploymentId}/events`,
    {}
  );

  const deploymentResponse = await zeitClient.fetch(
    `/v9/now/deployments/${deploymentId}`,
    {}
  );

  const deploymentEvents = await eventsResponse.json();
  const deployment = await deploymentResponse.json();

  return { deployment, deploymentEvents };
};

module.exports = {
  render,
  fetch,
};
