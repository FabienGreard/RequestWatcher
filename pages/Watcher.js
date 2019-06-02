const chart = require('asciichart');
const { htm } = require('@zeit/integration-utils');
const { AverageBox, Graph, Notification } = require('../components');
const { colors } = require('../theme.js');

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

const getGraphFromData = ({ data, cumulative, representedValue, start, end, color }) => {
  const NB_POINT = 50;
  const step = Math.max((end - start) / NB_POINT, 0.000000000000000000000001);
  const batchedData = Array(NB_POINT)
    .fill(0)
    .map((_, index) =>
      sumOf(
        data.filter(
          elt => elt.created < start + (index + 1) * step && elt.created >= start + index * step,
        ),
        representedValue,
      ),
    );
  const displayData = cumulative
    ? batchedData.reduce((prev, next) => {
        const last = prev[prev.length - 1] || 0;
        prev.push(last + next);
        return prev;
      }, [])
    : batchedData;
  const dataMax = Math.max(...displayData);
  return Graph.generateGraph({
    dataMax: dataMax,
    xRange: [start, end],
    xFormat: Graph.formatDate,
    yRange: [0, dataMax],
    yFormat: Graph.formatValue,
    dateStart: new Date(start).toDateString(),
    dateEnd: new Date(end).toDateString(),
    data: displayData,
    color,
  });
};

const render = ({ deploymentEvents, clientState }) => {
  const errorEvent = deploymentEvents.filter(({ type }) => type === 'stderr').map(formatEvent);
  const normalEvent = deploymentEvents.filter(({ type }) => type !== 'stderr');
  const buildEvent = normalEvent
    .filter(
      ({
        payload: {
          info: { type },
        },
      }) => type === 'build',
    )
    .map(formatEvent);
  const outputEvent = normalEvent
    .filter(
      ({
        payload: {
          info: { type },
        },
      }) => type === 'output',
    )
    .map(formatEvent);
  const allEvent = [...errorEvent, ...buildEvent, ...outputEvent];
  const {
    representedValue = 'duration',
    cumulative = false,
    errorRepresentedValue = 'duration',
    errorCumulative = false,
  } = clientState;

  if (deploymentEvents.length === 0)
    return Notification('warn', "it seems like we can't fetch any logs for this deployment");

  const uid = deploymentEvents[0].payload.deploymentId;
  const action = 'overview/' + uid;

  const start = allEvent[0].created;
  const end = allEvent[allEvent.length - 1].created + 1;

  const graph = getGraphFromData({
    data: allEvent,
    representedValue,
    cumulative,
    start,
    end,
  });

  const errorGraph = getGraphFromData({
    data: errorEvent,
    representedValue: errorRepresentedValue,
    cumulative: errorCumulative,
    start,
    end,
    color: colors.red,
  });

  return htm`<Box display="flex" justifyContent="space-arround">
   ${AverageBox(allEvent, 'duration', 'Average Duration', 'MS')}
   ${AverageBox(allEvent, 'billedDuration', 'Average Billed Duration', 'MS')}
   ${AverageBox(allEvent, 'memorySize', 'Average Memory size', 'MB')}
   ${AverageBox(allEvent, 'maxMemoryUsed', 'Average Memory Used', 'MB')}</Box>
   <Box
    display="flex"
    margin="20px 0"
   >
      <Box
        backgroundColor="#fff"
        backgroundImage=${`url(${graph})`}
        backgroundSize="contain"
        backgroundRepeat="no-repeat"
        backgroundPosition="center"
        flex=1
        height="250px"
        borderRadius="10px"
        border="1px solid #eaeaea"
        padding="10px"
        marginRight="20px"
      />
      <Box>
        <Select name="representedValue" value="${representedValue}" action="${action}">
          <Option value="duration" caption="duration in ms"/>
          <Option value="billedDuration" caption="billed duration in ms"/>
          <Option value="memorySize" caption="memory size in MB"/>
          <Option value="maxMemoryUsed" caption="max memory used in MB"/>
        </Select>
        <Box
          backgroundColor="#fff"
          borderRadius="10px"
          border="1px solid #eaeaea"
          padding="10px"
          margin="20px 0"
        >
          <Checkbox name="cumulative" label="cumulative" checked="${cumulative}" action="${action}"/>
        </Box>
      </Box>
  </Box>
  <Box
  display="flex"
  margin="20px 0"
 >
  <Box
    backgroundColor="#fff"
    backgroundImage=${`url(${errorGraph})`}
    backgroundSize="contain"
    backgroundRepeat="no-repeat"
    backgroundPosition="center"
    flex=1
    height="250px"
    borderRadius="10px"
    border="1px solid #eaeaea"
    padding="10px"
    marginRight="20px"
  />
    <Box>
      <Select name="errorRepresentedValue" value="${representedValue}" action="${action}">
        <Option value="duration" caption="duration in ms"/>
        <Option value="billedDuration" caption="billed duration in ms"/>
        <Option value="memorySize" caption="memory size in MB"/>
        <Option value="maxMemoryUsed" caption="max memory used in MB"/>
      </Select>
      <Box
        backgroundColor="#fff"
        borderRadius="10px"
        border="1px solid #eaeaea"
        padding="10px"
        margin="20px 0"
      >
        <Checkbox name="errorCumulative" label="cumulative" checked="${cumulative}" action="${action}"/>
      </Box>
    </Box>
  </Box>
  <AutoRefresh timeout="3000" action="${action}"/>`;
};

const fetch = async ({ zeitClient, deploymentId }) => {
  const eventsResponse = await zeitClient.fetch(`/v2/now/deployments/${deploymentId}/events`, {});

  const deploymentResponse = await zeitClient.fetch(`/v9/now/deployments/${deploymentId}`, {});

  const deploymentEvents = await eventsResponse.json();
  // const deploymentEvents = Array(1000)
  //   .fill(0)
  //   .map((elt, index) => ({
  //     type: Math.random() < 0.3 ? 'stdout' : 'stderr',
  //     created: 82308677230 + index * 100000,
  //     payload: {
  //       deploymentId: 32,
  //       text: `Duration: ${Math.pow(Math.random(), 5) *
  //         100} ms Billed Duration: ${100} ms Memory Size: ${83} MB Max Memory Used: ${3200} MB`,
  //       info: {
  //         type: 'output',
  //       },
  //     },
  //   }));
  const deployment = await deploymentResponse.json();

  return { deployment, deploymentEvents };
};

module.exports = {
  render,
  fetch,
};
