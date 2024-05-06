import { EmbeddedScene,  
  SceneDataTransformer,
  SceneVariableSet,
  VariableValueSelectors,
  PanelBuilders,
  QueryVariable,
  VariableValueSingle,
  SceneQueryRunner,
  SceneFlexItem,
  SceneFlexLayout,


} from '@grafana/scenes';

import { SQL_DATASOURCE_2 } from '../../constants';
import {  GraphDrawStyle, LegendDisplayMode, SortOrder, StackingMode, TooltipDisplayMode, VisibilityMode } from '@grafana/schema';
import { PanelMetaData } from '../SceneAppPageInitialization';


export function getProcessDetailsScene(serverId: VariableValueSingle, server: string) {

  const processUsers = users(serverId, server).clone()
  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [processUsers]
    }),
    body: new SceneFlexLayout({
      direction: "row",
      children: [
          new SceneFlexItem({
              minWidth: 300,
              minHeight: 300,
              body: new SceneFlexLayout({
                  direction: "column",
                  children: [
                      new SceneFlexItem({
                          minWidth: 300,
                          minHeight: 300,
                          body: getProcessTimeseries(transformedData(serverId, 'PMEM', server), processPmemMetaData).build(),
                      }),
                      new SceneFlexItem({
                          minWidth: 300,
                          minHeight: 300,
                          body: getProcessTimeseries(transformedData(serverId, 'PCPU', server), processPcpuMetaData).build(),
                      }),
                      new SceneFlexItem({
                          minWidth: 300,
                          minHeight: 300,
                          body: getProcessTimeseriesBars(transformedData(serverId, 'GpuCount', server), processGpuCountMetaData).build(),
                      }),
                  ]
              })
          }),
          new SceneFlexItem({
              minWidth: 300,
              minHeight: 300,
              body: new SceneFlexLayout({
                  direction: "column",
                  children: [
                      new SceneFlexItem({
                          minWidth: 300,
                          minHeight: 300,
                          body: getProcessTimeseriesBars(transformedData(serverId, 'OverallGPUVram', server), processgpuVramsMetaData).build(),
                      }),
                      new SceneFlexItem({
                          minWidth: 300,
                          minHeight: 300,
                          body: getProcessTimeseriesBars(transformedData(serverId, 'Niceness', server), processNicenessMetaData).build(),
                      }),
                      new SceneFlexItem({
                          minWidth: 300,
                          minHeight: 300,
                          body: getProcessTimeseriesBars(transformedData(serverId, 'CPUTime', server), processCpuTimeMetaData).build(),
                      }),
                  ]
              })
          })
      ]
  }),
  
  controls: [new VariableValueSelectors({})],
  });
}

const users = (serverId: VariableValueSingle, server: string) => new QueryVariable({
  name: `userProcess${server}`,
  label: 'User Name',
  description: "Select ony one user",
  datasource: SQL_DATASOURCE_2,
  query: `SELECT Login from User u
          JOIN UserHasUsed us ON u.Id = us.UserId
          WHERE MachineId = ${serverId}`,
  sort: 5,
  isMulti: false,
  includeAll: false,
  defaultToAll: false
});

const processDetailsQuery = (serverId: VariableValueSingle, field: string, server: string) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, $__interval, 0) as time, CONCAT(Command, ' (PID: ', Pid, ')'), AVG(pe.${field}) AS ${field}
      FROM ProcessRecord pe
      JOIN User u ON Id = UserId
      WHERE MachineId = '${serverId}' AND login = '$userProcess${server}' AND $__timeFilter(UserRecordTimeCreated) 
      GROUP BY time, Command
      ORDER BY time`
  }],

});

const transformedData = (serverId: VariableValueSingle ,field: string, server: string) => new SceneDataTransformer({
  $data: processDetailsQuery(serverId, field, server),
  transformations: [
      {
      id: 'renameByRegex',
      options: {
          regex: `${field} (.*)`,
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

const processCpuTimeMetaData: PanelMetaData = {
  title: "Cpu Time of process",
  description: "This graph shows Cpu Time of the processes of selected user that exceeds one of the thresholds in the description",
  unit: "s",
  noValue: "Selected user has no high alert processes within selected time range"
}

const processNicenessMetaData: PanelMetaData = {
  title: "Niceness of process",
  description: "This graph shows the niceness values of processes belonging to selected users that exceeds one of the thresholds in the description",
  unit: "",
  min: -20,
  max: 20,
  noValue: "Selected user has no high alert processes within selected time range"
}

const processGpuCountMetaData: PanelMetaData = {
  title: "Number of GPUs occupied by process",
  description: "This graph shows the number of GPUs occupied by the processes of selected user that exceeds one of the thresholds in the description",
  unit: "",
  noValue: "Selected user has no high alert processes within selected time range"
}

const processgpuVramsMetaData: PanelMetaData = {
  title: "GPU VRAM used by a process",
  description: "This graph shows Overall GPU VRAM used by the processes of selected user that exceeds one of the thresholds in the description",
  unit: "GB",
  noValue: "Selected user has no high alert processes within selected time range"
}

const processPcpuMetaData: PanelMetaData = {
  title: "CPU Utilization",
  description: "This graph shows CPU utilization of processes of selected user that exceeds one of the thresholds in the description",
  unit: "%",
  noValue: "Selected user has no high alert processes within selected time range",  
}

const processPmemMetaData: PanelMetaData = {
  title: "RAM Utilization",
  description: "This graph shows RAM utilization of processes of selected user that exceeds one of the thresholds in the description",
  unit: "%",
  noValue: "Selected user has no high alert processes within selected time range",
  max: 100,
  min: 0
}

const getProcessTimeseries = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
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
      
    })
  .setOption("tooltip", {
    mode: TooltipDisplayMode.Multi,
    sort: SortOrder.Descending
  })
  .setCustomFieldConfig('showPoints', VisibilityMode.Never)
  .setDecimals(2)
  .setData(data)
}

const getProcessTimeseriesBars = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
  return getProcessTimeseries(data, panelMetaData)
  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
  .setCustomFieldConfig('fillOpacity', 100)
  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal})
  
}


