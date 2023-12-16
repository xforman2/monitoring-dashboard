import React from 'react';
import {getGpuUsageAppScene} from './GpuUsageScene';

export const GpuUsagePluginPage = () => {
  const scene = getGpuUsageAppScene();

  return <scene.Component model={scene} />;
};
