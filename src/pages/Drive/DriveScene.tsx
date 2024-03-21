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
import { ThresholdsMode, TooltipDisplayMode, VisibilityMode} from '@grafana/schema';


const getDiskTimeline = (data: SceneDataTransformer) => {
  return PanelBuilders.statushistory()
  .setOption("tooltip", {
    mode: TooltipDisplayMode.Single,
  })
  .setMin(0)
  .setMax(100000000)
  .setThresholds({
    mode: ThresholdsMode.Percentage,
    steps: [ 
              {"value": 20, "color": "#73BF69"},
              {"value": 40, "color": "#FADE2A"},
              {"value": 60, "color": "#FF9820"},
              {"value": 80, "color": "#F2495C"}
            ]
  })
  .setOption("showValue", VisibilityMode.Never)
  .setData(data)
                          
}


export function getDriveScene(serverId: VariableValueSingle) {
  
  const driveUsers = users.clone();

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [driveUsers]
    }),
    body:
     new SceneGridLayout({
      isDraggable: true,
      isLazy: true,
      children: [

          new SceneGridItem({
            x: 0,
            y: 0,
            width: 24,
            height: 14,
            body: getDiskTimeline(transformedData(diskQuery(serverId), 'BlocksUsed'))
            .setTitle("Disk Usage").build()
          }),
          new SceneGridItem({
            x:0,
            y:14,
            width: 24,
            height: 14,
            body: getDiskTimeline(transformedData(filesQuery(serverId), 'FilesUsed'))
            .setTitle("Number of Files").build()
          }),
        
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}

const users = new QueryVariable({
  name: 'userDrive',
  label: 'User Name',
  datasource: SQL_DATASOURCE_2,
  query: "SELECT login from User",
  sort: 5,
  isMulti: true,
  includeAll: true,
  defaultToAll: true,
  maxVisibleValues: 2
});

const diskQuery = (text: VariableValueSingle) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT TimeCreated as time, Login, BlocksUsed
      FROM UserDiskRecord dr
      JOIN User u ON UserId = u.Id
      WHERE BlocksUsed IS NOT NULL AND MachineId = '${text}' AND Login IN ($userDrive) AND $__timeFilter(TimeCreated) 
      ORDER BY time`
  }],

});

const filesQuery = (text: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT TimeCreated as time, Login, FilesUsed
        FROM UserDiskRecord dr
        JOIN User u ON UserId = u.Id
        WHERE FilesUsed IS NOT NULL AND MachineId = '${text}' AND Login  IN ($userDrive) AND $__timeFilter(TimeCreated) 
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
})

