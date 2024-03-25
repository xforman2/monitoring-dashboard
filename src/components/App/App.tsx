import React from 'react';
import { AppRootProps } from '@grafana/data';
import { PluginPropsContext } from '../../utils/Plugin';
import { ServerMonitoringSceneApp} from '../ServerMonitoringSceneApp'
export class App extends React.PureComponent<AppRootProps> {
  render() {
    return (
      <PluginPropsContext.Provider value={this.props}>
        <ServerMonitoringSceneApp/>
      </PluginPropsContext.Provider>
    );
  }
}


