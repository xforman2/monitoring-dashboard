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

import {  SQL_DATASOURCE_2 } from '../../constants';
import { ThresholdsMode, TooltipDisplayMode, VisibilityMode} from '@grafana/schema';
import { PanelMetaData } from '../SceneAppPageInitialization';

const blocksPanelMetaData: PanelMetaData = {
  title: "Drive Space Utilizaition (%)",
  description: "This timeline shows the amount of space utilized by a user.",
  unit: "%",
  min: 0,
  max: 100,
  noValue: ""
}

const filesPanelMetaData: PanelMetaData = {
  title: "File Count (%)",
  description: "This timeline shows the amount of user files.",
  unit: "",
  max: 100,
  min: 0,
  noValue: ""
}

const getDriveStatusHistory = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
  return PanelBuilders.statushistory()
  .setTitle(panelMetaData.title)
  .setDescription(panelMetaData.description)
  .setUnit(panelMetaData.unit)  
  .setOption("tooltip", {
    mode: TooltipDisplayMode.Multi,
    
  })
  .setMin(panelMetaData.min)
  .setMax(panelMetaData.max)

  .setThresholds({
    mode: ThresholdsMode.Percentage,
    steps: [ 
              {"value": 0, "color": "#73BF69"},
              {"value": 10, "color": "#FADE2A"},
              {"value": 30, "color": "#FF9820"},
              {"value": 50, "color": "#F2495C"}
            ]
  })
  .setOption("showValue", VisibilityMode.Never)
  .setDecimals(2)
  .setData(data)
                          
}


export function getDriveScene(serverId: VariableValueSingle, server: string) {
  
  const driveUsers = users(serverId, server).clone();

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [driveUsers]
    }),
    body:
    new SceneFlexLayout({
      direction: "column",
      children: [
        new SceneFlexItem({
            minHeight: 500,
            body: getDriveStatusHistory(transformedData(diskQuery(serverId, server), 'DiskSpaceUsed'), blocksPanelMetaData).build()
        }),
        new SceneFlexItem({
            
            minHeight: 500,
            body: getDriveStatusHistory(transformedData(filesQuery(serverId, server), 'FilesUsed'), filesPanelMetaData).build()
        })
      ]          
    }),
    controls: [new VariableValueSelectors({})],
  });
}

const users = (serverId: VariableValueSingle, server: string) => new QueryVariable({
  name: `userDrive${server}`,
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

const diskQuery = (serverId: VariableValueSingle, server: string) => new SceneQueryRunner({
  queries: 
  [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT TimeCreated as time, Login, (DiskSpaceUsed / DiskLimit) * 100 As DiskSpaceUsed
      FROM UserDiskRecord dr
      JOIN User u ON UserId = u.Id
      JOIN Machine m ON MachineId = m.Id
      WHERE DiskSpaceUsed IS NOT NULL AND MachineId = '${serverId}' AND Login IN ($userDrive${server}) AND $__timeFilter(TimeCreated) 
      ORDER BY time`
  }],

});

const filesQuery = (serverId: VariableValueSingle, server: string) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
          rawSql: `SELECT TimeCreated as time, Login, (FilesUsed / FileLimit) * 100 As FilesUsed
          FROM UserDiskRecord dr
          JOIN User u ON UserId = u.Id
          JOIN Machine m ON MachineId = m.Id
          WHERE FilesUsed IS NOT NULL AND MachineId = '${serverId}' AND Login  IN ($userDrive${server}) AND $__timeFilter(TimeCreated) 
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

