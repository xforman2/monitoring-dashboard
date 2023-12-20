import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { HomePage } from '../../pages/Home';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';
import { GpuUsagePluginPage } from '../../pages/GpuUsage';
import { CpuPluginPage } from 'pages/Cpu';
import { RamPluginPage } from '../../pages/Ram';
import { DiskPluginPage } from 'pages/Disk';
import { ProcessPluginPage } from 'pages/ProcessDetails';

export const Routes = () => {
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.Home}`)} component={HomePage} />
      <Route path={prefixRoute(`${ROUTES.GpuUsage}`)} component={GpuUsagePluginPage} />
      <Route path={prefixRoute(`${ROUTES.Cpu}`)} component={CpuPluginPage} />
      <Route path={prefixRoute(`${ROUTES.Ram}`)} component={RamPluginPage} />
      <Route path={prefixRoute(`${ROUTES.Disk}`)} component={DiskPluginPage} />
      <Route path={prefixRoute(`${ROUTES.ProcessDetails}`)} component={ProcessPluginPage} />
      <Redirect to={prefixRoute(ROUTES.Home)} />
    </Switch>
  );
};
