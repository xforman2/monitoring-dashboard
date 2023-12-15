import React from 'react';
import {getHelloWorldAppScene} from './helloWorldScene';

export const HelloWorldPluginPage = () => {
  const scene = getHelloWorldAppScene();

  return <scene.Component model={scene} />;
};
