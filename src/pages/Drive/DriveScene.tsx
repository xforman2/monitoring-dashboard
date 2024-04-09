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
  title: "Block Usage",
  description: "This timeline shows the amount of blocks utilized by a user.",
  unit: "",
  max: 100000000,
  noValue: ""
}

const filesPanelMetaData: PanelMetaData = {
  title: "File Count",
  description: "This timeline shows the amount of user`s files.",
  unit: "",
  max: 100000000,
  noValue: ""
}

const getDriveStatusHistory = (data: SceneDataTransformer, panelMetaData: PanelMetaData) => {
  return PanelBuilders.statushistory()
  .setTitle(panelMetaData.title)
  .setDescription(panelMetaData.description)
  .setUnit(panelMetaData.unit)  
  .setOption("tooltip", {
    mode: TooltipDisplayMode.Single,
  })
  .setMin(panelMetaData.min)
  .setMax(panelMetaData.max)

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
    new SceneFlexLayout({
      direction: "column",
      children: [
        new SceneFlexItem({
            minHeight: 500,
            body: getDriveStatusHistory(transformedData(diskQuery(serverId), 'BlocksUsed'), blocksPanelMetaData).build()
        }),
        new SceneFlexItem({
            
            minHeight: 500,
            body: getDriveStatusHistory(transformedData(filesQuery(serverId), 'FilesUsed'), filesPanelMetaData).build()
        })
      ]          
    }),
    controls: [new VariableValueSelectors({})],
  });
}

const users = new QueryVariable({
  name: 'userDrive',
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

