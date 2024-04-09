import { getCpuScene } from './CpuScene';
import { PageProps, getAppPage } from '../SceneAppPageInitialization';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';
import { SceneTimeRange } from '@grafana/scenes';

const cpuProps: PageProps = {
  title: "CPU Dashboard",
  route: prefixRoute(`${ROUTES.Cpu}`),
  description: "This dashboard show utilization of CPU",
  timeRange: new SceneTimeRange({from: "now-6h"})
}
export const getCpuAppPage = () => getAppPage(cpuProps, getCpuScene)

