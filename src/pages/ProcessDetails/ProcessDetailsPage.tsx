import React from 'react';
import { getProcessDetailsScene } from './ProcessDetailsScene';
import { useSceneApp } from '@grafana/scenes';
import { SceneMetaData, getAppScene } from 'utils/GlobalSceneObjects';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';

const processMetaData: SceneMetaData = {
  title: "Process Details Dashboard",
  route: prefixRoute(`${ROUTES.ProcessDetails}`),
  description: ""
}

const getProcessDetailsAppScene = () => {
  return getAppScene( processMetaData, getProcessDetailsScene);
}
export const ProcessPluginPage = () => {
  const scene = useSceneApp(getProcessDetailsAppScene);

  return <scene.Component model={scene} />;
};
