const { Notification, Deployment } = require('../components');
const { htm } = require('@zeit/integration-utils');

const render = ({ deployments, projectId }) => htm`
    <ProjectSwitcher />
    ${deployments.map(
      ({ name, url, created, state, uid }) =>
        htm`<${Deployment} name=${name} url=${url} created=${created} state=${state} id=${uid} />`
    )}
    ${
      deployments.length === 0
        ? Notification(
            'warn',
            projectId
              ? "it seems like you haven't deployed this project yet, you might want to switch project"
              : "it seems like you haven't deployed anything yet, you might wanna do so and come back"
          )
        : ''
    }
  `;

const fetch = async ({ payload, zeitClient }) => {
  const { projectId } = payload;

  try {
    const res = await zeitClient.fetch(
      projectId
        ? `/v4/now/deployments?projectId=${projectId}&limit=10`
        : `/v4/now/deployments?limit=10`,
      {}
    );

    const { deployments } = await res.json();

    return { deployments, projectId };
  } catch (error) {
    console.log(error);
    throw new Error('Timeout');
  }
};

module.exports = {
  render,
  fetch,
};
