import React from 'react';
import {  getRamScene } from './RamScene';
import { useSceneApp } from '@grafana/scenes';
import { SceneMetaData, getAppScene } from 'utils/GlobalSceneObjects';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';

const ramMetaData: SceneMetaData = {
  title: "RAM Dashboard",
  route: prefixRoute(`${ROUTES.Ram}`),
  description: ""
}

const getRamAppScene = () => {
  return getAppScene(ramMetaData, getRamScene)
}
export const RamPluginPage = () => {
  const scene = useSceneApp(getRamAppScene);

  return <scene.Component model={scene} />;
};
