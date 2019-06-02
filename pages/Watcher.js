const { htm } = require('@zeit/integration-utils');
const { AverageBox, Graph, Notification } = require('../components');
const { colors } = require('../theme.js');

const durationRegex = /Duration:\s([0-9.]+)\sms/;
const billedDurationRegex = /Billed Duration:\s([0-9.]+)\sms/;
const memorySizeRegex = /Memory Size:\s([0-9.]+)\sMB/;
const maxMemoryUsedRegex = /Max Memory Used:\s([0-9.]+)\sMB/;

const TRANSLATIONS = {
  duration: 'duration in ms',
  billedDuration: 'billed duration in ms',
  memorySize: 'memory size in MB',
  maxMemoryUsed: 'max memory used in MB',
};

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

const getDisplayableData = ({
  NB_POINT,
  step,
  data,
  representedValue,
  cumulative,
  start,
}) => {
  const batchedData = Array(NB_POINT)
    .fill(0)
    .map((_, index) =>
      sumOf(
        data.filter(
          elt =>
            elt.created < start + (index + 1) * step &&
            elt.created >= start + index * step
        ),
        representedValue
      )
    );
  const displayData =
    cumulative === 'cumulative'
      ? batchedData.reduce((prev, next) => {
          const last = prev[prev.length - 1] || 0;
          prev.push(last + next);
          return prev;
        }, [])
      : batchedData;
  return displayData;
};

const getGraphFromData = ({
  data,
  cumulative,
  representedValues,
  start,
  end,
  color,
  curves,
}) => {
  const NB_POINT = 50;
  const step = Math.max((end - start) / NB_POINT, 0.000000000000000000000001);
  const displayData = getDisplayableData({
    NB_POINT,
    step,
    data,
    representedValue: representedValues[0],
    cumulative,
    start,
  });
  const dataList = representedValues
    .map(representedValue => ({
      data: getDisplayableData({
        NB_POINT,
        step,
        data,
        representedValue,
        cumulative,
        start,
      }),
      name: TRANSLATIONS[representedValue],
    }))
    .sort((a, b) => Math.max(...b.data) - Math.max(...a.data));
  const dataMax = Math.max(...dataList.map(elt => Math.max(...elt.data)));
  return Graph.generateGraph({
    dataMax: dataMax,
    xRange: [start, end],
    xFormat: Graph.formatDate,
    yRange: [0, dataMax],
    yFormat: Graph.formatValue,
    dateStart: new Date(start).toDateString(),
    dateEnd: new Date(end).toDateString(),
    data: displayData,
    dataList,
    color,
    curves,
  });
};

const render = ({ deploymentEvents, clientState }) => {
  const events = deploymentEvents.map(formatEvent);

  const {
    durationRepresentedValue = 'duration',
    durationCumulative = 'cumulative',
    durationExperimentalCurves = 'none',
    memorySizeRepresentedValue = 'memorySize',
    memorySizeCumulative = 'cumulative',
    memorySizeExperimentalCurves = 'none',
  } = clientState;

  if (deploymentEvents.length === 0)
    return Notification(
      'warn',
      "it seems like we can't fetch any logs for this deployment"
    );

  const uid = deploymentEvents[0].payload.deploymentId;
  const action = 'overview/' + uid;

  const start = events[0].created;
  const end = events[events.length - 1].created + 1;

  const durationGraph = getGraphFromData({
    data: events,
    representedValues: durationRepresentedValue.split(','),
    cumulative: durationCumulative,
    start,
    end,
    curves: durationExperimentalCurves,
  });

  const memorySizeGraph = getGraphFromData({
    data: events,
    representedValues: memorySizeRepresentedValue.split(','),
    cumulative: memorySizeCumulative,
    start,
    end,
    color: colors.red,
    curves: memorySizeExperimentalCurves,
  });

  return htm`<Box display="flex" justifyContent="space-between">
   ${AverageBox(events, 'duration', 'Average Duration', 'MS')}
   ${AverageBox(events, 'billedDuration', 'Average Billed Duration', 'MS')}
   ${AverageBox(events, 'memorySize', 'Average Memory size', 'MB')}
   ${AverageBox(events, 'maxMemoryUsed', 'Average Memory Used', 'MB')}</Box>
   <Box border="1px solid #eaeaea" borderRadius="10px" backgroundColor="#fff" textAlign="center" padding="10px 20px" width="200px">
     <H1>DURATION</H1>
   </Box>
   <Box
    display="flex"
    margin="20px 0"
   >
      <Box
        backgroundColor="#fff"
        backgroundImage=${`url(${durationGraph})`}
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
      <Box display="flex" flexDirection="column">
        <Select name="durationRepresentedValue" value="${durationRepresentedValue}" action="${action}">
          <Option value="duration" caption="${TRANSLATIONS.duration}"/>
          <Option value="billedDuration" caption="${
            TRANSLATIONS.billedDuration
          }"/>
          <Option value="billedDuration,duration" caption="all durations in ms"/>
        </Select> 
      <Box margin="10px 0">
        <Select name="durationCumulative" value="${durationCumulative}" action="${action}">
          <Option value="cumulative" caption="Cumulative"/>
          <Option value="separate" caption="Separate"/>
        </Select>
      </Box>
      <Box>
        <P>Experimental feature :</P>
        <Select name="durationExperimentalCurves" value="${durationExperimentalCurves}" action="${action}">
          <Option value="none" caption="none" />
          <Option value="rough" caption="rough" />
          <Option value="gentle" caption="gentle" />
          <Option value="curvy" caption="curvy" />
        </Select>
      </Box>
    </Box>
  </Box>
  <Box border="1px solid #eaeaea" borderRadius="10px" backgroundColor="#fff" textAlign="center" padding="10px 20px" width="200px"> 
     <H1>MEMORY</H1>
   </Box>
  <Box
  display="flex"
  margin="20px 0"
 >
  <Box
    backgroundColor="#fff"
    backgroundImage=${`url(${memorySizeGraph})`}
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
    <Box display="flex" flexDirection="column">      
      <Select name="memorySizeRepresentedValue" value="${memorySizeRepresentedValue}" action="${action}">
        <Option value="memorySize" caption="${TRANSLATIONS.memorySize}"/>
        <Option value="maxMemoryUsed" caption="${TRANSLATIONS.maxMemoryUsed}"/>
        <Option value="memorySize,maxMemoryUsed" caption="all memory usage in ms"/>
      </Select>
     <Box margin="10px 0">
        <Select name="memorySizeCumulative" value="${memorySizeCumulative}" action="${action}">
          <Option value="cumulative" caption="Cumulative"/>
          <Option value="separate" caption="Separate"/>
        </Select>
      </Box> 
      <Box>
        <P>Experimental feature :</P>
        <Select name="memorySizeExperimentalCurves" value="${memorySizeExperimentalCurves}" action="${action}">
          <Option value="none" caption="none" />
          <Option value="rough" caption="rough" />
          <Option value="gentle" caption="gentle" />
          <Option value="curvy" caption="curvy" />
        </Select>
      </Box>
    </Box>
  </Box>
  <AutoRefresh timeout="3000" action="${action}"/>`;
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
