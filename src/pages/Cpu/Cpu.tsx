import React from 'react';
import { getCpuAppScene } from './CpuScene';
import { useSceneApp } from '@grafana/scenes';

export const CpuPluginPage = () => {
  const scene = useSceneApp(getCpuAppScene);

  return <scene.Component model={scene} />;
};
