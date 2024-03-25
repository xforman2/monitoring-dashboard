import { EmbeddedScene,  
  SceneDataTransformer,
  SceneVariableSet,
  VariableValueSelectors,
  PanelBuilders,
  QueryVariable,
  VariableValueSingle,
  SceneQueryRunner,
  SceneFlexLayout,
  SceneFlexItem,
} from '@grafana/scenes';

import { SQL_DATASOURCE_2 } from '../../constants';
import { GraphDrawStyle, LegendDisplayMode, SortOrder,StackingMode,TooltipDisplayMode, VisibilityMode } from '@grafana/schema';
import { PanelMetaData } from '../SceneAppPageInitialization';

const users = new QueryVariable({
  name: 'userCpu',
  label: 'User Name',
  description: "Select one or multiple users",
  datasource: SQL_DATASOURCE_2,
  query: "SELECT login from User",
  sort: 5,
  isMulti: true,
  includeAll: true,
  defaultToAll: true,
  maxVisibleValues: 2
});

export const getCpuScene = (serverId: VariableValueSingle) => {
  
  
  const cpuUsers = users.clone()
  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [cpuUsers]
    }),
    body: new SceneFlexLayout({
      direction: "column",
      children: [
        new SceneFlexLayout({
          direction: "row",
          children: [
            new SceneFlexItem({
            minWidth: 300, 
            minHeight: 300,
            body: getCpuTimeseries(transformedData(pcpuQuery(serverId), 'PCPU'), cpuUsageMetaData)
                  .build()
            }),
            new SceneFlexItem({
              minWidth: 300, 
              minHeight: 300,
              body: getCpuTimeseriesBars(transformedData(highCpuTimeQuery(serverId), 'HighCpuTime'), highCpuTimeMetaData)
                    .build()
                  
            }),
        ]
        }),
        new SceneFlexLayout({
            children: [

                
              new SceneFlexItem({
                minWidth: 300, 
                minHeight: 300,
                body: getCpuTimeseriesBars(transformedData(processCountQuery(serverId), 'ProcessCount'), processCountMetaData)
                      .build()
              }),
              new SceneFlexItem({
                minWidth: 300, 
                minHeight: 300,
                body: getCpuTimeseriesBars(transformedData(sleepingProcessesQuery(serverId), 'IOSleeping'), ioSleepingMetaData)
                      .build()
              }),
          
            ]
        })
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}


const getCpuTimeseries = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
  return PanelBuilders.timeseries()
  .setTitle(panelMetaData.title)
  .setMin(panelMetaData.min)
  .setMax(panelMetaData.max)
  .setDescription(panelMetaData.description)
  .setUnit(panelMetaData.unit)
  .setOption("legend", {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: "right",
      calcs: ["mean"],
    })
  .setOption("tooltip", {
    mode: TooltipDisplayMode.Multi,
    sort: SortOrder.Descending
  })
  .setCustomFieldConfig('showPoints', VisibilityMode.Never)
  .setData(data)
}

const cpuUsageMetaData: PanelMetaData = {
  title: "CPU Utilization",
  description: "This graph show user utilization of CPU, one core equals 100%. The value can be over a 100",
  unit: "%"
}

const highCpuTimeMetaData: PanelMetaData = {
  title: "High Cpu Time Count",
  description: "This graph shows us number of user processes that are classified as High Cpu Time",
  unit: ""
}

const processCountMetaData: PanelMetaData = {
  title: "Process Count",
  description: "This graph shows amout of processes belonging to selected users",
  unit: ""
}

const ioSleepingMetaData: PanelMetaData = {
  title: "Sleeping Process Count  ",
  description: "This graph shows amount of user processes in sleeping state",
  unit: ""
}

const getCpuTimeseriesBars = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
  return getCpuTimeseries(data, panelMetaData)
  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
  .setCustomFieldConfig('fillOpacity', 100)
  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal})
  
}

const pcpuQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(TimeCreated, $__interval, 0) as time, ur.PCPU, u.login
      FROM UserRecord ur
      JOIN User u ON ur.UserID = u.ID
      WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
      ORDER BY time`
  }],

});


const highCpuTimeQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(TimeCreated, $__interval, 0) as time, ur.HighCpuTime, u.login
      FROM UserRecord ur
      JOIN User u ON ur.UserID = u.ID
      WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
      ORDER BY time`
  }],

});

const processCountQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(TimeCreated, $__interval, 0) as time, ur.ProcessCount, u.login
      FROM UserRecord ur
      JOIN User u ON ur.UserID = u.ID
      WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
      ORDER BY time`
  }],

});

const sleepingProcessesQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(TimeCreated, $__interval, 0) as time, ur.IOSleeping, u.login
      FROM UserRecord ur
      JOIN User u ON ur.UserID = u.ID
      WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
      ORDER BY time`
  }],

});


const transformedData = (query: SceneQueryRunner, field: string) => new SceneDataTransformer({
  $data: query,
  transformations: [
      {
      id: 'renameByRegex',
      options: {
          regex: `${field}(.*)`,
          renamePattern: '$1',
      },
      },
      {
      id: "convertFieldType",
      options: {
          conversions: [
          {
              destinationType: "number",
              targetField: `${field}`
          }
          ],
          fields: {}
      }
      }
  ],
});
