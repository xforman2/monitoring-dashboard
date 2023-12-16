import React from 'react';
import { getCpuAppScene } from './CpuScene';

export const CpuPluginPage = () => {
  const scene = getCpuAppScene();

  return <scene.Component model={scene} />;
};
