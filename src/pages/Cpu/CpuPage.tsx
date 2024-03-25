import { getCpuScene } from './CpuScene';
import { PageMetaData, getAppPage } from '../SceneAppPageInitialization';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';

const cpuMetaData: PageMetaData = {
  title: "CPU Dashboard",
  route: prefixRoute(`${ROUTES.Cpu}`),
  description: "This dashboard show utilization of CPU"
}
export const getCpuAppPage = () => getAppPage(cpuMetaData, getCpuScene)

