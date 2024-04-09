import { EmbeddedScene, 
  SceneFlexLayout, 
  SceneFlexItem, 
  PanelBuilders,
  QueryVariable, 
  SceneVariableSet, 
  VariableValueSelectors, 
  SceneQueryRunner,
  SceneDataTransformer,
  SceneDataLayerControls,
  VariableValueSingle,
  SceneByVariableRepeater,
  dataLayers,
  SceneDataLayerSet,
  
} from '@grafana/scenes';

import { SQL_DATASOURCE_2 } from '../../constants';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VisibilityMode} from '@grafana/schema';
import { SceneRadioToggle } from 'utils/SceneRadioToggle';
import { ShowBasedOnConditionBehavior } from 'utils/ShowBasedOnConditionBehavior';
import { AnnotationEventFieldSource } from '@grafana/data';


const users = new QueryVariable({
  name: 'userGpu',
  label: 'User Name',
  description: "Select one or multiple users",
  datasource: SQL_DATASOURCE_2,
  query: "SELECT login from User",
  sort: 5,
  isMulti: true,
  includeAll: true,
  maxVisibleValues: 2,
  defaultToAll: true

});

export const getGpuScene = (serverId: VariableValueSingle, server: string): EmbeddedScene =>  {
  const gpus = new QueryVariable({
    name: `gpu${server}`,
    label: 'GPU',
    datasource: SQL_DATASOURCE_2,
    query: `SELECT Id as __value, Name as __text from Gpu WHERE MachineID = ${serverId}`,
    sort: 5,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
    defaultToAll: true
  });

  const gpuUsers = users.clone()

  const variableSet = new SceneVariableSet({
    variables: [gpuUsers, gpus],
  })
  
  const scene = new EmbeddedScene({
    $variables: variableSet,
    body: new SceneByVariableRepeater({
      variableName: `gpu${server}`,
      body: new SceneFlexLayout({
        direction: "column",
        children: []
      }),
      getLayoutChild: (option) => {
        return new SceneFlexLayout({
          $data: new SceneDataLayerSet({
            layers: [annotations(option.value)]
          }),
          children: [
            new SceneFlexItem({
              $data: transformedData(gpuMemoryUsage(serverId, option.value)),
              $behaviors: [
                new ShowBasedOnConditionBehavior({
                  references: ["toggle"],
                  condition: (toggle: SceneRadioToggle) => {
                    return toggle.state.value === "visible" 
                  }
                }),
                
              ],

              minHeight: 250,
              
              body: getGpuTimeseries(option.label)
                    .build(),
            })

          ]
        })
      },
      
    }),
    
    controls: [
              new VariableValueSelectors({}),
              new SceneDataLayerControls(),
              new SceneRadioToggle({
                key: "toggle",
                options: [
                  { value: 'visible', label: 'Show no data panels' },
                  { value: 'hidden', label: 'Hide no data panels' },
                ],
                value: 'visible',
              }),
              ],
              
  })
  
  return scene;
}

const gpuMemoryUsage = (serverId: VariableValueSingle, gpu: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
      datasource: SQL_DATASOURCE_2,
      
      refId: 'A',
      format: "time_series",

      
      rawSql: ` SELECT 
                    $__timeGroup(TimeCreated, $__interval, 0) AS time,
                    AVG(MemoryUsage) as MemoryUsage,
                    Login 
                FROM 
                    (
                        SELECT 
                            u.Login,
                            IFNULL(MemoryUsage, 0) AS MemoryUsage,
                            IFNULL(RecordTimeCreated, FROM_UNIXTIME($__unixEpochFrom())) AS TimeCreated
                        FROM 
                            User u
                        LEFT JOIN (
                            SELECT  
                                UserId,
                                (MemoryUsage / AvailableMemoryMB) * 100 as MemoryUsage,
                                RecordTimeCreated
                            FROM   
                              GpuReceipt gr
                            JOIN Gpu g ON g.ID = gr.GpuID
                            WHERE 
                                $__timeFilter(RecordTimeCreated) AND MachineId = ${serverId} AND GpuId = ${gpu}
                        ) gr ON u.Id = gr.UserId
                    ) res 
                WHERE Login IN ($userGpu)
                GROUP BY time, Login
                ORDER BY 
                    time
      `,
    }]
  })

const transformedData = (queryRunner: SceneQueryRunner) => new SceneDataTransformer({
  $data: queryRunner, 
  transformations: [
    {
      id: 'renameByRegex',
      options: {
        regex: 'MemoryUsage(.*)',
        renamePattern: '$1',
      },
    },
    {
      id: "convertFieldType",
      options: {
          conversions: [
          {
              destinationType: "number",
              targetField: `MemoryUsage`
          }
          ],
          fields: {}
      }
      
    }
  ],
});

const annotations = (gpu: VariableValueSingle) => new dataLayers.AnnotationsDataLayer({
  name: `Reservation`,
  description: "Show reservation of users on this GPU",
  query: {
    name: 'New annotation',
    datasource: SQL_DATASOURCE_2,
    enable: true,
    iconColor: 'red',
    target: {
      refId: 'Anno',
      // @ts-ignore
      format: 'table',
      // @ts-ignore
      rawSql: `SELECT r.Id, UserID, Start, End, Login
             FROM Reservation r JOIN User u ON UserID = u.Id 
             WHERE login IN ($userGpu) AND GpuId = '${gpu}' AND ($__timeFilter(Start) OR $__timeFilter(End))
             `
      
    },
    mappings: {
      id: {
        source: AnnotationEventFieldSource.Field,
        value: "Id"
      },
      text: {
        source: AnnotationEventFieldSource.Text,
        value: "reserved this gpu"
      },
      time: {
        source: AnnotationEventFieldSource.Field,
        value: "Start"
      },
      timeEnd: {
        source: AnnotationEventFieldSource.Field,
        value: "End"
      },
      title: {
        source: AnnotationEventFieldSource.Field,
        value: "login"
      }
    }
  },
});

const getGpuTimeseries = (gpu: VariableValueSingle) => { 
  const gpuDesc = `This graph shows VRAM utilization on ${gpu} of users over time with reservation annotations`
  
  return PanelBuilders.timeseries()
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
                      .setCustomFieldConfig('showPoints', VisibilityMode.Never)
                      .setUnit("%").setTitle(gpu + ' VRAM Usage')
                      .setHeaderActions(new SceneDataLayerControls())
                      .setDescription(gpuDesc)
                      .setMax(100)
                      .setDecimals(2)
                      .setNoValue("Selected users have no usage recorded on this GPU within the selected time range.")
}


