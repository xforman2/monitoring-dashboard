import { getDriveScene } from './DriveScene';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';
import { PageProps, getAppPage } from '../SceneAppPageInitialization';
import { SceneTimeRange } from '@grafana/scenes';

const driveProps: PageProps = {
  title: "Drive Dashboard",
  route: prefixRoute(`${ROUTES.Drive}`),
  description: "This dashboard shows users utilization of drives captured once a day",
  timeRange: new SceneTimeRange({from: "now-2d"})
}

export const getDriveAppPage = () => {
  return getAppPage( driveProps, getDriveScene)
}


