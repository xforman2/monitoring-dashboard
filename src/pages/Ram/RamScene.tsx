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

import {  SQL_DATASOURCE_2 } from '../../constants';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode,  VisibilityMode } from '@grafana/schema';


export const getRamScene = (serverId: VariableValueSingle) => {
  const ramUsers = users.clone()

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [ramUsers]
    }),
    body: new SceneGridLayout({
      isDraggable: true,
      isLazy: true,
      children: [
        new SceneGridItem({
          x: 0,
          y: 0,
          width: 24,
          height: 8,
          body: getRamTimeseries(transformedData(ramQuery(serverId), 'PMEM')).build()
        }),
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}

const getRamTimeseries = (data: SceneDataTransformer) => {
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
  .setData(data).setTitle("RAM %").setUnit("%")
                          
}


const users = new QueryVariable({
  name: 'user',
  label: 'User Name',
  datasource: SQL_DATASOURCE_2,
  query: "SELECT login from User",
  sort: 1,
  isMulti: true,
  includeAll: true,
  defaultToAll: true
});


const ramQuery = (serverId: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.PMEM, u.login
      FROM UserRecord ur
      JOIN User u ON ur.UserID = u.ID
      WHERE  MachineId = '${serverId}' AND u.login IN ($user) AND $__timeFilter(TimeCreated) 
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
