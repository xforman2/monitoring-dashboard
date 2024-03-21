import React from 'react';
import { getDriveScene } from './DriveScene';
import { useSceneApp } from '@grafana/scenes';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';
import { SceneMetaData, getAppScene } from 'utils/GlobalSceneObjects';

const driveMetaData: SceneMetaData = {
  title: "Drive Dashboard",
  route: prefixRoute(`${ROUTES.Drive}`),
  description: ""
}

const getDriveAppScene = () => {
  return getAppScene( driveMetaData, getDriveScene)
}

export const DrivePluginPage = () => {
  const scene = useSceneApp(getDriveAppScene)

  return <scene.Component model={scene} />;
};
