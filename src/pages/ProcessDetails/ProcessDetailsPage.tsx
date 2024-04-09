import { getProcessDetailsScene } from './ProcessDetailsScene';
import { PageProps, getAppPage } from '../SceneAppPageInitialization';
import { prefixRoute } from 'utils/Routing';
import { ROUTES } from '../../constants';
import React from 'react';
import { SceneTimeRange } from '@grafana/scenes';

const processProps: PageProps = {
  title: "Process Details Dashboard",
  route: prefixRoute(`${ROUTES.ProcessDetails}`),
  description: <div>
                <p>This dashboard displays user processes that require attention and have exceeded one of these thresholds:</p>
                <ul className='indented-list'>
                  <li>CPU Utilization of the process &gt; 400%</li>
                  <li>CPU Time of the process &gt; 1 hour</li>
                  <li>Number or GPUs utilized by the process &gt; 0</li>
                </ul>
              </div>,
  timeRange: new SceneTimeRange({from: "now-6h"})

}

export const getProcessDetailsAppPage = () => {
  return getAppPage( processProps, getProcessDetailsScene);
}
