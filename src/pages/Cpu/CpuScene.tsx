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

const users = (serverId: VariableValueSingle, server: string) => new QueryVariable({
  name: `userCpu${server}`,
  label: 'User Name',
  description: "Select one or multiple users",
  datasource: SQL_DATASOURCE_2,
  query: `SELECT Login from User u
          JOIN UserHasUsed us ON u.Id = us.UserId
          WHERE MachineId = ${serverId}`,
  sort: 5,
  isMulti: true,
  includeAll: true,
  defaultToAll: true,
  maxVisibleValues: 2
});

export const getCpuScene = (serverId: VariableValueSingle, server: string) => {
  
  
  const cpuUsers = users(serverId, server).clone()
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
            body: getCpuTimeseries(transformedData(serverId, server, "PCPU"), cpuUsageMetaData)
                  .build()
            }),
            new SceneFlexItem({
              minWidth: 300, 
              minHeight: 300,
              body: getCpuTimeseriesBars(transformedData(serverId, server, "HighCpuTime"), highCpuTimeMetaData)
                    .build()
                  
            }),
        ]
        }),
        new SceneFlexLayout({
            children: [

                
              new SceneFlexItem({
                minWidth: 300, 
                minHeight: 300,
                body: getCpuTimeseriesBars(transformedData(serverId, server, "ProcessCount"), processCountMetaData)
                      .build()
              }),
              new SceneFlexItem({
                minWidth: 300, 
                minHeight: 300,
                body: getCpuTimeseriesBars(transformedData(serverId, server, "IOSleeping"), ioSleepingMetaData)
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
  .setNoValue(panelMetaData.noValue)
  .setOption("legend", {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: "right",
      calcs: ["mean"],
      sortBy: "Mean",
      sortDesc: true
    })
  .setOption("tooltip", {
    mode: TooltipDisplayMode.Single,
    sort: SortOrder.Descending
  })
  
  .setCustomFieldConfig('showPoints', VisibilityMode.Never)
  .setDecimals(2)
  .setData(data)
}

const cpuUsageMetaData: PanelMetaData = {
  title: "CPU Utilization",
  description: "This graph show user utilization of CPU, one core equals 100%. The value can be over a 100",
  unit: "%",
  noValue: "Selected users have no CPU Utilization recorded within selected time range"
  
}

const highCpuTimeMetaData: PanelMetaData = {
  title: "High Cpu Time Count",
  description: "This graph shows us number of user processes that are classified as High Cpu Time",
  unit: "",
  noValue: "Selected users have no High Cpu Time processes recorded within selected time range"
}

const processCountMetaData: PanelMetaData = {
  title: "Process Count",
  description: "This graph shows amout of processes belonging to selected users",
  unit: "",
  noValue: "Selected users have no processes withing selected time range"
}

const ioSleepingMetaData: PanelMetaData = {
  title: "Sleeping Process Count  ",
  description: "This graph shows amount of user processes in sleeping state",
  unit: "",
  noValue: "Selected users have no sleeping processes withing selected time range"
}

const getCpuTimeseriesBars = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
  return getCpuTimeseries(data, panelMetaData)
  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
  .setCustomFieldConfig('fillOpacity', 100)
  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal})
  
}

const cpuQuery = (serverId: VariableValueSingle, server: string, field: string) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: ` SELECT 
                    $__timeGroup(TimeCreated, $__interval, 0) AS time,
                    AVG(${field}) as ${field},
                    Login 
                FROM 
                    (
                        SELECT 
                            u.Login,
                            IFNULL(${field}, 0) AS ${field},
                            IFNULL(TimeCreated, FROM_UNIXTIME($__unixEpochFrom())) AS TimeCreated
                        FROM 
                            User u
                        LEFT JOIN (
                            SELECT  
                                UserId,
                                ${field},
                                TimeCreated
                            FROM   
                                UserRecord
                            WHERE 
                                $__timeFilter(TimeCreated) AND MachineId = ${serverId}
                        ) ur ON u.Id = ur.UserId
                    ) res 
                WHERE Login IN ($userCpu${server})
                GROUP BY time, Login
                ORDER BY 
                    time
                `
  }],

});


const transformedData = (serverId: VariableValueSingle, server: string, field: string) => new SceneDataTransformer({
  $data: cpuQuery(serverId, server, field),
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
