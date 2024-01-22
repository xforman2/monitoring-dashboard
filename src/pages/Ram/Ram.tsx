import React from 'react';
import { getRamAppScene } from './RamScene';
import { useSceneApp } from '@grafana/scenes';

export const RamPluginPage = () => {
  const scene = useSceneApp(getRamAppScene);

  return <scene.Component model={scene} />;
};
