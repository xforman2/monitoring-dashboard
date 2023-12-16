import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { HomePage } from '../../pages/Home';
import { PageWithTabs } from '../../pages/WithTabs';
import { WithDrilldown } from '../../pages/WithDrilldown';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { HelloWorldPluginPage } from '../../pages/HelloWorld';
import { GpuUsagePluginPage } from '../../pages/GpuUsage';
import { CpuPluginPage } from 'pages/Cpu';
import { RamPluginPage } from '../../pages/Ram';

export const Routes = () => {
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.WithTabs}`)} component={PageWithTabs} />
      <Route path={prefixRoute(`${ROUTES.WithDrilldown}`)} component={WithDrilldown} />
      <Route path={prefixRoute(`${ROUTES.Home}`)} component={HomePage} />
      <Route path={prefixRoute(`${ROUTES.HelloWorld}`)} component={HelloWorldPluginPage} />
      <Route path={prefixRoute(`${ROUTES.GpuUsage}`)} component={GpuUsagePluginPage} />
      <Route path={prefixRoute(`${ROUTES.Cpu}`)} component={CpuPluginPage} />
      <Route path={prefixRoute(`${ROUTES.Ram}`)} component={RamPluginPage} />
      <Redirect to={prefixRoute(ROUTES.Home)} />
    </Switch>
  );
};
