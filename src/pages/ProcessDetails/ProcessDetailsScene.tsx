import { EmbeddedScene,  
  SceneDataTransformer,
  SceneGridLayout,
  SceneGridItem,
  SceneVariableSet,
  VariableValueSelectors,
  PanelBuilders,
  QueryVariable,
  VariableValueSingle,
  SceneQueryRunner,


} from '@grafana/scenes';

import { SQL_DATASOURCE_2 } from '../../constants';
import {  GraphDrawStyle, LegendDisplayMode, SortOrder, StackingMode, TooltipDisplayMode, VisibilityMode } from '@grafana/schema';
import { PanelMetaData } from '../SceneAppPageInitialization';


export function getProcessDetailsScene(serverId: VariableValueSingle) {

  const processUsers = users.clone()
  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [processUsers]
    }),
    body: new SceneGridLayout({
      isDraggable: true,
      isLazy: true,
      children: [
        new SceneGridItem({
          x: 0,
          y: 0,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(pmemQuery(serverId), 'PMEM'), processPmemMetaData)
            .build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 0,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(pcpuQuery(serverId), 'PCPU'), processPcpuMetaData)
            .build(),
        }),
        new SceneGridItem({
          x: 0,
          y: 8,
          width: 12,
          height: 8,
          body: getProcessTimeseriesBars(transformedData(gpuCountQuery(serverId), 'GpuCount'), processGpuCountMetaData)
            .build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 8,
          width: 12,
          height: 8,
          body: getProcessTimeseriesBars(transformedData(vramQuery(serverId), 'OverallGPUVram'), processgpuVramsMetaData)
            .build(),
        }),
        new SceneGridItem({
          x: 0,
          y: 16,
          width: 12,
          height: 8,
          body: getProcessTimeseriesBars(transformedData(nicenessQuery(serverId), 'Niceness'), processNicenessMetaData)
            .build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 16,
          width: 12,
          height: 8,
          body: getProcessTimeseriesBars(transformedData(cpuTimeQuery(serverId), 'CPUTime'), processCpuTimeMetaData)
            .build(),
        }),
        
      ] 
    }),  
    controls: [new VariableValueSelectors({})],
  });
}

const users = new QueryVariable({
  name: 'userProcess',
  label: 'User Name',
  description: "Select one user",
  datasource: SQL_DATASOURCE_2,
  query: "SELECT login from User",
  sort: 5,
  isMulti: false,
  includeAll: false
});

const gpuCountQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, $__interval, 0) as time, Command, pe.GpuCount
      FROM ProcessRecord pe
      JOIN User u ON Id = UserId
      WHERE MachineId = '${text}' AND login = '$userProcess' AND $__timeFilter(UserRecordTimeCreated) 
      ORDER BY time`
  }],

});

const pcpuQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, $__interval, 0) as time, Command, pe.PCPU
      FROM ProcessRecord pe
      JOIN User u ON Id = UserId
      WHERE MachineId = '${text}' AND login = '$userProcess' AND $__timeFilter(UserRecordTimeCreated) 
      ORDER BY time`
  }],

});

const pmemQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, $__interval, 0) as time, Command, pe.PMEM
      FROM ProcessRecord pe
      JOIN User u ON Id = UserId
      WHERE MachineId = '${text}' AND login = '$userProcess' AND $__timeFilter(UserRecordTimeCreated) 
      ORDER BY time`
  }],

});

const nicenessQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, $__interval, 0) as time, Command, pe.Niceness
      FROM ProcessRecord pe
      JOIN User ON Id = UserId
      WHERE MachineId = '${text}' AND login = '$userProcess' AND $__timeFilter(UserRecordTimeCreated) 
      ORDER BY time`
  }],

});

const vramQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, $__interval, 0) as time, Command, pe.OverallGPUVram
      FROM ProcessRecord pe
      JOIN User ON Id = UserId
      JOIN Machine m ON MachineId = m.ID
      WHERE MachineId = '${text}' AND login = '$userProcess' AND $__timeFilter(UserRecordTimeCreated) 
      ORDER BY time`
  }],

});

const cpuTimeQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, $__interval, 0) as time, Command, TIME_TO_SEC(pe.CPUTime) as CPUTime
      FROM ProcessRecord pe
      JOIN User ON Id = UserId
      JOIN Machine m ON MachineId = m.ID
      WHERE MachineId = '${text}' AND login = '$userProcess' AND $__timeFilter(UserRecordTimeCreated) 
      ORDER BY time`
  }],

});



const transformedData = (query: SceneQueryRunner, field: string) => new SceneDataTransformer({
  $data: query,
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
  unit: "s"
}

const processNicenessMetaData: PanelMetaData = {
  title: "Niceness of process",
  description: "This graph shows the niceness values of processes belonging to selected users that exceeds one of the thresholds in the description",
  unit: "",
  min: -20,
  max: 20
}

const processGpuCountMetaData: PanelMetaData = {
  title: "Number of GPUs occupied by process",
  description: "This graph shows the number of GPUs occupied by the processes of selected user that exceeds one of the thresholds in the description",
  unit: ""
}

const processgpuVramsMetaData: PanelMetaData = {
  title: "GPU VRAM used by a process",
  description: "This graph shows Overall GPU VRAM used by the processes of selected user that exceeds one of the thresholds in the description",
  unit: "GB"
}

const processPcpuMetaData: PanelMetaData = {
  title: "CPU Utilization",
  description: "This graph shows CPU utilization of processes of selected user that exceeds one of the thresholds in the description",
  unit: "%"
}

const processPmemMetaData: PanelMetaData = {
  title: "RAM Utilization",
  description: "This graph shows RAM utilization of processes of selected user that exceeds one of the thresholds in the description",
  unit: "%"
}

const getProcessTimeseries = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
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

const getProcessTimeseriesBars = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
  return getProcessTimeseries(data, panelMetaData)
  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
  .setCustomFieldConfig('fillOpacity', 100)
  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal})
  
}
