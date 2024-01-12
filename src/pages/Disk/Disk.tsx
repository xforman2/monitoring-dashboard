import React from 'react';
import { getDiskAppScene } from './DiskScene';
import { useSceneApp } from '@grafana/scenes';

export const DiskPluginPage = () => {
  const scene = useSceneApp(getDiskAppScene)

  return <scene.Component model={scene} />;
};
