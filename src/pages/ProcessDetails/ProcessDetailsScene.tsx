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
import {  LegendDisplayMode, SortOrder, TooltipDisplayMode, VisibilityMode } from '@grafana/schema';


export function getProcessDetailsScene(serverId: VariableValueSingle) {

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [users]
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
          body: getProcessTimeseries(transformedData(vramQuery(serverId), 'OverallGPUVram'))
            .setTitle("Overall GPU VRAM Used by Process")
            .setUnit("MB")
            .build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 0,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(nicenessQuery(serverId), 'Niceness'))
            .setTitle("Niceness of Process")
            .build(),
        }),
        new SceneGridItem({
          x: 0,
          y: 8,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(gpuCountQuery(serverId), 'GpuCount'))
            .setTitle("Number of GPUs occupied by process")
            .build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 8,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(cpuTimeQuery(serverId), 'CPUTime'))
            .setTitle("CPU Time of process").setUnit("s")
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
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, pe.GpuCount
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
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, pe.Niceness
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
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, pe.OverallGPUVram
      FROM ProcessRecord pe
      JOIN User ON Id = UserId
      JOIN Machine m ON MachineId = m.ID
      WHERE MachineId = '${text}' AND login = '$userrocess' AND $__timeFilter(UserRecordTimeCreated) 
      ORDER BY time`
  }],

});

const cpuTimeQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, TIME_TO_SEC(pe.CPUTime) as CPUTime
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

const getProcessTimeseries = (data: SceneDataTransformer) => {
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
  .setData(data)
                          
}
