import React from 'react';

import { SceneApp, SceneAppPage, useSceneApp } from '@grafana/scenes';
import { getBasicScene } from './scenes';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';

const getHomeAppScene = () => {
  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Server Monitoring',
        hideFromBreadcrumbs: false,
        url: prefixRoute(ROUTES.Home),
        getScene: () => {
          return getBasicScene();
        },
      }),
    ],
  });
};
export const HomePage = () => {
  const scene = useSceneApp(getHomeAppScene);

  return <scene.Component model={scene} />;

};
