import React from 'react';
import { getProcessAppScene } from './ProcessDetailsScene';
import { useSceneApp } from '@grafana/scenes';

export const ProcessPluginPage = () => {
  const scene = useSceneApp(getProcessAppScene);

  return <scene.Component model={scene} />;
};
