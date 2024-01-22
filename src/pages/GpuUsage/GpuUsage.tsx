import React from 'react';
import {getGpuUsageAppScene} from './GpuUsageScene';
import { useSceneApp } from '@grafana/scenes';

export const GpuUsagePluginPage = () => {
  const scene = useSceneApp(getGpuUsageAppScene);

  return <scene.Component model={scene} />;
};
