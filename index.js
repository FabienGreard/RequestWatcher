const { withUiHook, htm } = require('@zeit/integration-utils');
const { Home, Watcher, Layout } = require('./pages');

module.exports = withUiHook(async ({ zeitClient, payload }) => {
  const { project, projectId, action } = payload;

  // We emulate a basic route like /:id
  const [url, parameter] = action.split('/');

  switch (url) {
    case 'overview': {
      const { deployment, ...watcherProps } = await Watcher.fetch({
        payload,
        zeitClient,
        deploymentId: parameter,
      });

      const title = deployment.error
        ? htm`Overall usage of ${deployment.error.id}`
        : htm`Overall usage of <Link href=${'https://' + deployment.url}>${
            deployment.url
          }</Link>`;

      return Layout(
        title,
        Watcher.render({
          ...watcherProps,
          clientState: payload.clientState,
        }),
        true
      );
    }
    default: {
      const homeProps = await Home.fetch({ payload, zeitClient });

      return Layout(
        projectId ? `Deployments of ${project.name}` : 'Deployments',
        Home.render(homeProps),
        false
      );
    }
  }
});
