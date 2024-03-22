import {
  EmbeddedScene,
  SceneFlexLayout,
  SceneReactObject,
} from '@grafana/scenes';
import { Card } from '@grafana/ui';
import { ROUTES } from '../../constants';
import React from 'react';
import { prefixRoute } from 'utils/Routing';
import { Cpu, HardDrive, Activity } from 'react-feather';
import { BsGpuCard } from 'react-icons/bs';
import { FaMemory } from 'react-icons/fa';
import '../../styles/main.css';

export const getBasicScene = (templatised = true, seriesToShow = '__server_names') => {
  
  return new EmbeddedScene({
    body: new SceneFlexLayout({
      direction: "column",
      children: [
        new SceneReactObject({
          reactNode: (
            <Card href={prefixRoute(ROUTES.Gpu)}>
                <h3 className='center-content'>GPU Dashboard</h3>
                <BsGpuCard size={50}></BsGpuCard >    
            </Card>
          ),
        }),
        new SceneReactObject({
          reactNode: (
            <Card href={prefixRoute(ROUTES.Cpu)}>
                <h3 className='center-content'>CPU Dashboard</h3>
                <Cpu size={50}></Cpu >    
            </Card>
          ),
        }),
        new SceneReactObject({
          reactNode: (
            <Card href={prefixRoute(ROUTES.Drive)}>
                <h3 className='center-content'>Drive Dashboard</h3>
                <HardDrive size={50}></HardDrive >    
            </Card>
          ),
        }),
        new SceneReactObject({
          reactNode: (
            <Card href={prefixRoute(ROUTES.Ram)}>
                <h3 className="center-content">RAM Dashboard</h3>
                <FaMemory size={50}></FaMemory >    
            </Card>
          ),
        }),
        new SceneReactObject({
          reactNode: (
            <Card href={prefixRoute(ROUTES.ProcessDetails)}>
                <h3 className='center-content'>Process Details Dashboard</h3>
                <Activity size={50}></Activity >    
            </Card>
          ),
        }),
      ],
    }),
  })
}
