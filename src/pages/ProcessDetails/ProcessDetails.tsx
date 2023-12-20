import React from 'react';
import { getProcessAppScene } from './ProcessDetailsScene';

export const ProcessPluginPage = () => {
  const scene = getProcessAppScene();

  return <scene.Component model={scene} />;
};
