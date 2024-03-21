import React from 'react';
import { getCpuScene } from './CpuScene';
import { useSceneApp } from '@grafana/scenes';
import { SceneMetaData, getAppScene } from 'utils/GlobalSceneObjects';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';

const cpuMetaData: SceneMetaData = {
  title: "CPU Dashboard",
  route: prefixRoute(`${ROUTES.Cpu}`),
  description: ""
}
const getCpuAppScene = () => getAppScene(cpuMetaData, getCpuScene)
export const CpuPluginPage = () => {
  const scene = useSceneApp(getCpuAppScene);

  return <scene.Component model={scene} />;
};
