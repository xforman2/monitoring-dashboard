import {  getRamScene } from './RamScene';
import { PageProps, getAppPage } from '../SceneAppPageInitialization';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';
import { SceneTimeRange } from '@grafana/scenes';

const ramProps: PageProps = {
  title: "RAM Dashboard",
  route: prefixRoute(`${ROUTES.Ram}`),
  description: "This dashboard shows utilization of RAM",
  timeRange: new SceneTimeRange({from: "now-6h"})
}

export const getRamAppPage = () => {
  return getAppPage(ramProps, getRamScene)
}
