import { getGpuScene } from './GpuScene';
import { PageMetaData, getAppPage } from '../SceneAppPageInitialization';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';

const gpuMetaData: PageMetaData = {
  title: "GPU Dashboard",
  route: prefixRoute(`${ROUTES.Gpu}`),
  description: "This dashboard shows utilization of GPU"
}

export const getGpuAppPage = () => {
  return getAppPage( gpuMetaData, getGpuScene)
}



