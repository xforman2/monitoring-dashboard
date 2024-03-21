import React from 'react';
import { useSceneApp } from '@grafana/scenes';
import { getGpuScene } from './GpuScene';
import { SceneMetaData, getAppScene } from 'utils/GlobalSceneObjects';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';

const gpuMetaData: SceneMetaData = {
  title: "GPU Dashboard",
  route: prefixRoute(`${ROUTES.Gpu}`),
  description: ""
}

const getGpuAppScene = () => {
  return getAppScene( gpuMetaData, getGpuScene)
}
export const GpuPluginPage = () => {
  const scene = useSceneApp(getGpuAppScene);

  return <scene.Component model={scene} />;
};


