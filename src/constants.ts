import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  Gpu = 'gpu',
  Cpu = "cpu",
  Ram = "ram",
  Drive = "drive",
  ProcessDetails = "process-details"
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};

export const SQL_DATASOURCE_1 = {
  uid: 'server-monitoring',
  type: 'mysql'
}

export const SQL_DATASOURCE_2 = {
  uid: 'server-monitoring-alfa',
  type: 'mysql'
}
