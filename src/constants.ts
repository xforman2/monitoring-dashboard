import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  GpuUsage = 'gpu-usage',
  Cpu = "cpu",
  Ram = "ram",
  Disk = "disk",
  ProcessDetails = "process-details"
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};

export const SQL_DATASOURCE = {
  uid: 'server-monitoring',
  type: 'mysql'
}
