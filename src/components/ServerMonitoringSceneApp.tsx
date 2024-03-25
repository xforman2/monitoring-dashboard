import React from 'react';
import { SceneApp, useSceneApp } from "@grafana/scenes";
import { getCpuAppPage } from "pages/Cpu/CpuPage";
import { getDriveAppPage } from "pages/Drive/DrivePage";
import { getGpuAppPage } from "pages/Gpu/GpuPage";
import { getProcessDetailsAppPage } from "pages/ProcessDetails/ProcessDetailsPage";
import { getRamAppPage } from "pages/Ram/RamPage";
import { getHomePage } from 'pages/Home/HomePage';

export const ServerMonitoringSceneApp = () => {
    const scene = useSceneApp(getAppScene);
    return <scene.Component model={scene} />;
  };
  
  
const getAppScene = (): SceneApp => {
  return new SceneApp({
    pages: [
      getHomePage(),
      getRamAppPage(),
      getCpuAppPage(),
      getGpuAppPage(),
      getDriveAppPage(),
      getProcessDetailsAppPage()

    ]
  })
}

