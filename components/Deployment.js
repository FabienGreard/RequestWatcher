const { htm } = require('@zeit/integration-utils');
const {
  colors: { green, red },
} = require('../theme.js');

const timestamp = time => {
  const date = new Date(Date.now() - time);

  return `${Math.round(date.getTime() / (24 * 3600 * 1000))} d`;
};

module.exports = ({ name, url, created, state, id }) => {
  const safeUrl = 'https://' + url; // nice templating fu**ers
  const action = 'overview/' + id;

  return htm`<Box display="flex" justifyContent="space-between" alignItems="center" padding="30px 15px" margin="20px 0px" background-color="#FFFFFF" borderRadius="10px">
<Box display="flex" flexDirection="column">
  <H1>${name}</H1>
  <Link href=${safeUrl}>${url}</Link>
</Box>
<P>${timestamp(created)}</P>
<Box color="${state === 'READY' ? green : red}"><P>${state}</P></Box>
<Button action=${action}>Overview</Button>
</Box>`;
};
