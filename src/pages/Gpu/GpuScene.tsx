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
import { AnnotationEventFieldSource } from '@grafana/data';


const users = (serverId: VariableValueSingle, server: string) => new QueryVariable({
  name: `userGpu${server}`,
  label: 'User Name',
  description: "Select one or multiple users",
  datasource: SQL_DATASOURCE_2,
  query: `SELECT Login from User u
          JOIN UserHasUsed us ON u.Id = us.UserId
          WHERE MachineId = ${serverId}`,
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

  const gpuUsers = users(serverId, server).clone()

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
            layers: [annotations(option.value, server)]
          }),
          children: [
            new SceneFlexItem({
              $data: transformedData(gpuMemoryUsage(serverId, server, option.value)),
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
              ],
              
  })
  
  return scene;
}

const gpuMemoryUsage = (serverId: VariableValueSingle, server: string, gpu: VariableValueSingle) => new SceneQueryRunner({
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
                              GpuRecord gr
                            JOIN Gpu g ON g.ID = gr.GpuID
                            WHERE 
                                $__timeFilter(RecordTimeCreated) AND MachineId = ${serverId} AND GpuId = ${gpu}
                        ) gr ON u.Id = gr.UserId
                    ) res 
                WHERE Login IN ($userGpu${server})
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

const annotations = (gpu: VariableValueSingle, server: string) => new dataLayers.AnnotationsDataLayer({
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
      rawSql: `SELECT r.Id, Description, Start, End, Login
             FROM Reservation r JOIN User u ON UserID = u.Id 
             WHERE login IN ($userGpu${server}) 
             AND GpuId = '${gpu}' 
             AND ($__timeFilter(Start) OR $__timeFilter(End) OR ($__timeTo() BETWEEN Start AND End))
             `
      
    },
    mappings: {
      id: {
        source: AnnotationEventFieldSource.Field,
        value: "Id"
      },
      text: {
        source: AnnotationEventFieldSource.Field,
        value: "Description"
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
                          sortBy: "Mean",
                          sortDesc: true
                          
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


