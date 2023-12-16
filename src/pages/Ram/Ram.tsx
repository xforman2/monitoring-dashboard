import React from 'react';
import { getRamAppScene } from './RamScene';

export const RamPluginPage = () => {
  const scene = getRamAppScene();

  return <scene.Component model={scene} />;
};
