import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { HomePage } from '../../pages/Home/Home';
import { prefixRoute } from '../../utils/Routing';
import { ROUTES } from '../../constants';
import { GpuPluginPage } from '../../pages/Gpu/GpuPage';
import { CpuPluginPage } from 'pages/Cpu/CpuPage';
import { RamPluginPage } from '../../pages/Ram/RamPage';
import { DrivePluginPage } from 'pages/Drive/DrivePage';
import { ProcessPluginPage } from 'pages/ProcessDetails/ProcessDetailsPage';

export const Routes = () => {
  return (
    <Switch>
      <Route path={prefixRoute(`${ROUTES.Home}`)} component={HomePage} />
      <Route path={prefixRoute(`${ROUTES.Gpu}`)} component={GpuPluginPage} />
      <Route path={prefixRoute(`${ROUTES.Cpu}`)} component={CpuPluginPage} />
      <Route path={prefixRoute(`${ROUTES.Ram}`)} component={RamPluginPage} />
      <Route path={prefixRoute(`${ROUTES.Drive}`)} component={DrivePluginPage} />
      <Route path={prefixRoute(`${ROUTES.ProcessDetails}`)} component={ProcessPluginPage} />
      <Redirect to={prefixRoute(ROUTES.Home)} />
    </Switch>
  );
};
