import { EmbeddedScene, 
  SceneFlexLayout, 
  SceneFlexItem, 
  PanelBuilders,
  QueryVariable, 
  SceneVariableSet, 
  VariableValueSelectors, 
  SceneQueryRunner,
  SceneApp,
  SceneAppPage,
  SceneTimePicker,
  SceneDataTransformer,
  
  dataLayers,
  SceneDataLayers,
  SceneDataLayerControls,
  SceneCanvasText,
  behaviors,
  
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE_1, SQL_DATASOURCE_2 } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VisibilityMode} from '@grafana/schema';
import { AnnotationEventFieldSource } from '@grafana/data';

let selectedGpus: string[] | undefined = []


export const getGpuUsageAppScene = () => {
  return new SceneApp({
    pages: [
    new SceneAppPage({
      title: 'GPU Dashboard',
      controls: [new SceneTimePicker({ isOnCanvas: true })],
      url: prefixRoute(`${ROUTES.GpuUsage}`),
      hideFromBreadcrumbs: false,
      getScene: getScene,
    }),
  ]
  })
}

export function getScene() {

  const logWhenVariableChanges = new behaviors.ActWhenVariableChanged({
    variableName: 'gpu',
    onChange: (variable) => {
       selectedGpus = variable.getValue()?.toString().split(",").sort()
       console.log(selectedGpus)
    },
  });

  const users = new QueryVariable({
    name: 'user',
    label: 'User Name',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT login from User",
    sort: 1,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
  
  });
  
  const gpus = new QueryVariable({
    name: 'gpu',
    label: 'GPU',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT UUID from Gpu",
    sort: 1,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
  });

  const variableSet = new SceneVariableSet({
    variables: [users, gpus],
  })

  const model = new EmbeddedScene({
    $variables: variableSet,
    $behaviors: [logWhenVariableChanges],
    body: new SceneFlexLayout({
      children: [
        getGpuTimeseries(gpus)
      ],
    }),
    controls: [new VariableValueSelectors({}),
              new SceneDataLayerControls()],
  });

  return model;
}

const getPanel = (text: string) => { 
  const queryRunner = (text: string) => new SceneQueryRunner({
    queries: 
    [{
      datasource: SQL_DATASOURCE_2,
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT RecordTimeCreated as time, gr.MemoryUsage as MemoryUsage, u.login
      FROM GpuReceipt gr 
      JOIN Gpu g ON g.ID = gr.GpuID
      JOIN User u ON u.ID = gr.UserID
      WHERE u.login IN ($user) AND g.UUID = '${text}' AND $__timeFilter(RecordTimeCreated)
      ORDER BY time`,
    
      
    }],
    
    
  });
  
  const transformedData = (text: string) => new SceneDataTransformer({
    $data: queryRunner(text),
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
              targetField: "MemoryUsage"
            }
          ],
          fields: {}
        }
      }
    ],
  });
  return PanelBuilders.timeseries()
                      .setOption("legend", {
                          showLegend: true,
                          displayMode: LegendDisplayMode.Table,
                          placement: "right",
                        })
                      .setOption("tooltip", {
                        mode: TooltipDisplayMode.Multi,
                        sort: SortOrder.Descending
                      })
                      .setCustomFieldConfig('showPoints', VisibilityMode.Never)
                      .setUnit("MB").setData(transformedData(text)).setTitle(text + ' Memory Usage')
}

function getGpuTimeseries(gpus: QueryVariable){
  const globalAnnotations = (gpu: string) => new dataLayers.AnnotationsDataLayer({
    name: `Reservation`,
    query: {
      name: 'New annotation',
      datasource: SQL_DATASOURCE_1,
      enable: true,
      iconColor: 'red',
      target: {
        refId: 'Anno',
        // @ts-ignore
        format: 'table',
        // @ts-ignore
        rawSql: `SELECT r.Id, UserID, StartTime, EndTime, XLogin, 'Reservation' 
               FROM dbxforman2.Reservation r JOIN User u ON UserID = u.Id 
               WHERE Xlogin IN ($user) AND GPUUUID = '${gpu}'`
        
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
          value: "StartTime"
        },
        timeEnd: {
          source: AnnotationEventFieldSource.Field,
          value: "EndTime"
        },
        title: {
          source: AnnotationEventFieldSource.Field,
          value: "Xlogin"
        }
      }
    },
  });
  return new SceneFlexLayout({
    direction: "column",
    minHeight: 300,
    children: selectedGpus !== undefined &&  selectedGpus.length !== 0
    ? selectedGpus.map((option) => {

        return new SceneFlexItem({
          $data: new SceneDataLayers({
            layers: [globalAnnotations(option)]
          }),
          body: getPanel(option).setHeaderActions(new SceneDataLayerControls()).build(),
        });
      })
    : [ 
      new SceneFlexItem({
        body: new SceneCanvasText({
          align: 'center',
          text: `Please select GPU first`,
          fontSize: 30,
        }),
      }),
    ],
    
  });
}


