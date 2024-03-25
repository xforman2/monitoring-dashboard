import { getDriveScene } from './DriveScene';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';
import { PageMetaData, getAppPage } from '../SceneAppPageInitialization';

const driveMetaData: PageMetaData = {
  title: "Drive Dashboard",
  route: prefixRoute(`${ROUTES.Drive}`),
  description: "This dashboard shows users utilization of drives captured once a day"
}

export const getDriveAppPage = () => {
  return getAppPage( driveMetaData, getDriveScene)
}


