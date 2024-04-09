import { getGpuScene } from './GpuScene';
import { PageProps, getAppPage } from '../SceneAppPageInitialization';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';
import { SceneTimeRange } from '@grafana/scenes';

const gpuProps: PageProps = {
  title: "GPU Dashboard",
  route: prefixRoute(`${ROUTES.Gpu}`),
  description: "This dashboard shows utilization of GPU",
  timeRange: new SceneTimeRange({from: "now-6h"})
}

export const getGpuAppPage = () => {
  return getAppPage( gpuProps, getGpuScene)
}



