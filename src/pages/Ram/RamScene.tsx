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

import {  SQL_DATASOURCE_2 } from '../../constants';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode,  VisibilityMode } from '@grafana/schema';
import { PanelMetaData } from '../SceneAppPageInitialization';

const ramPanelMetaData: PanelMetaData = {
  title: "RAM Utilization",
  description: "This graph show user utilization of RAM",
  unit: "%",
  noValue: "Selected users have no RAM usage recorded within selected time range",
  max: 100
}

export const getRamScene = (serverId: VariableValueSingle) => {
  const ramUsers = users.clone()

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [ramUsers]
    }),
    body: new SceneFlexLayout({
      children: [
        new SceneFlexItem({
          body: getRamTimeseries(transformedData(ramQuery(serverId), 'PMEM'), ramPanelMetaData).build()
        }),
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}


const getRamTimeseries = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
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
    mode: TooltipDisplayMode.Single,
    sort: SortOrder.Descending
  })
  .setNoValue(panelMetaData.noValue)
  .setCustomFieldConfig('showPoints', VisibilityMode.Never)
  .setDecimals(2)
  .setData(data)
                          
}


const users = new QueryVariable({
  name: 'userRam',
  label: 'User Name',
  description: "Select one or multiple users",
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

      rawSql: 
      ` SELECT 
                    $__timeGroup(TimeCreated, $__interval, 0) AS time,
                    AVG(PMEM) as PMEM,
                    Login 
                FROM 
                    (
                        SELECT 
                            u.Login,
                            IFNULL(PMEM, 0) AS PMEM,
                            IFNULL(TimeCreated, FROM_UNIXTIME($__unixEpochFrom())) AS TimeCreated
                        FROM 
                            User u
                        LEFT JOIN (
                            SELECT  
                                UserId,
                                PMEM,
                                TimeCreated
                            FROM   
                                UserRecord
                            WHERE 
                                $__timeFilter(TimeCreated) AND MachineId = ${serverId}
                        ) ur ON u.Id = ur.UserId
                    ) res 
                WHERE Login IN ($userRam)
                GROUP BY time, Login
                ORDER BY 
                    time;
                `
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
