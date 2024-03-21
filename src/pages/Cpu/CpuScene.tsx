import { EmbeddedScene,  
  SceneDataTransformer,
  SceneVariableSet,
  VariableValueSelectors,
  PanelBuilders,
  QueryVariable,
  VariableValueSingle,
  SceneQueryRunner,
  behaviors,
  SceneFlexLayout,
  SceneFlexItem,
} from '@grafana/scenes';

import { SQL_DATASOURCE_2 } from '../../constants';
import { DashboardCursorSync, GraphDrawStyle, LegendDisplayMode, SortOrder,StackingMode,TooltipDisplayMode, VisibilityMode } from '@grafana/schema';

const users = new QueryVariable({
  name: 'userCpu',
  label: 'User Name',
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
    $behaviors: [new behaviors.CursorSync({
      sync: DashboardCursorSync.Crosshair
    })],
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
            body: getCpuTimeseries(transformedData(pcpuQuery(serverId), 'PCPU'), "CPU %")
                  .setUnit("%")
                  .build()
            }),
            new SceneFlexItem({
              minWidth: 300, 
              minHeight: 300,
              body: getCpuTimeseriesBars(transformedData(highCpuTimeQuery(serverId), 'HighCpuTime'), "High Cpu Time")
                    .build()
                  
            }),
        ]
        }),
        new SceneFlexLayout({
            children: [

                
              new SceneFlexItem({
                minWidth: 300, 
                minHeight: 300,
                body: getCpuTimeseriesBars(transformedData(processCountQuery(serverId), 'ProcessCount'), "Process Count")
                      .build()
              }),
              new SceneFlexItem({
                minWidth: 300, 
                minHeight: 300,
                body: getCpuTimeseriesBars(transformedData(sleepingProcessesQuery(serverId), 'IOSleeping'), "Sleeping Processes")
                      .build()
              }),
          
            ]
        })
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}


const getCpuTimeseries = (data: SceneDataTransformer, title: string) => {
  return PanelBuilders.timeseries()
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
  .setData(data).setTitle(title)
}

const getCpuTimeseriesBars = (data: SceneDataTransformer, title: string) => {
  return getCpuTimeseries(data, title)
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
      rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.PCPU, u.login
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
      rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.HighCpuTime, u.login
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
      rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.ProcessCount, u.login
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
      rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.IOSleeping, u.login
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
