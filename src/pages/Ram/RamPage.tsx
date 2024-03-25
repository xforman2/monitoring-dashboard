import {  getRamScene } from './RamScene';
import { PageMetaData, getAppPage } from '../SceneAppPageInitialization';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';

const ramMetaData: PageMetaData = {
  title: "RAM Dashboard",
  route: prefixRoute(`${ROUTES.Ram}`),
  description: "This dashboard shows utilization of RAM"
}

export const getRamAppPage = () => {
  return getAppPage(ramMetaData, getRamScene)
}
