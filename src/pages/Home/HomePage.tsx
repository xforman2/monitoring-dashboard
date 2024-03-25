import { SceneAppPage } from '@grafana/scenes';
import { getHomeScene } from './scenes';
import { prefixRoute } from '../../utils/Routing';
import { ROUTES } from '../../constants';

export const getHomePage = () => {
  return new SceneAppPage({
    title: 'Server Monitoring',
    hideFromBreadcrumbs: false,
    url: prefixRoute(ROUTES.Home),
    getScene: () => {
      return getHomeScene();
    },
  }) 
}

