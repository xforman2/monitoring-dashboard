import React from 'react';
import { getDiskAppScene } from './DiskScene';

export const DiskPluginPage = () => {
  const scene = getDiskAppScene();

  return <scene.Component model={scene} />;
};
