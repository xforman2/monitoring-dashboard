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
  SceneDataLayerControls,
  VariableValueSingle,
  SceneRefreshPicker,
  SceneByVariableRepeater,
  
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE_2 } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VariableHide, VisibilityMode} from '@grafana/schema';
import { SceneRadioToggle } from 'utils/SceneRadioToggle';
import { ShowBasedOnConditionBehavior } from 'utils/ShowBasedOnConditionBehavior';
import { cancelLoadingPage, getLoadingPage } from 'utils/LoadingPage';



export const getGpuUsageAppScene = () => {

  const servers = new QueryVariable({
    name: 'server',
    label: 'Server',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT Id __value, Name __text from Machine",
    sort: 1,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
    defaultToAll: true,
    hide: VariableHide.hideVariable
  
  });

  const page = new SceneAppPage({
    $variables: new SceneVariableSet({
      variables: [servers]
    }),
    title: 'GPU Dashboard',
    controls: [new SceneTimePicker({ isOnCanvas: true }),
               new SceneRefreshPicker({})],
    url: prefixRoute(`${ROUTES.Gpu}`),
    hideFromBreadcrumbs: false,
    tabs: [],
    getFallbackPage: getLoadingPage
  })
  
  page.addActivationHandler(() => {
    const sub = servers.subscribeToState((state) => {
      if (state.loading === false && state.options){
        
        page.setState({
          
          tabs: state.options.map((option) => {
            return getTab(option.label, option.value) 
          })
        })
      }
      
    })
    return () => sub.unsubscribe();
  });

  page.addActivationHandler(() => {
    cancelLoadingPage(page)
  })


  return new SceneApp({
    pages: [page]
  })
}

export function getTab(server: string, serverId: VariableValueSingle){
  return new SceneAppPage({
    title: `${server}`,
    url: prefixRoute(`${ROUTES.Gpu}/${server}`),
    getScene: () => getScene(serverId)
  })
}

export function getScene(serverId: VariableValueSingle) {
  const gpus = new QueryVariable({
    name: 'gpu' + serverId,
    label: 'GPU',
    datasource: SQL_DATASOURCE_2,
    query: `SELECT UUID from Gpu WHERE MachineID = ${serverId}`,
    sort: 5,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
    defaultToAll: true
  });

  const users = new QueryVariable({
    name: 'userGpu',
    label: 'User Name',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT login from User",
    sort: 5,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
    defaultToAll: true

  });

  const variableSet = new SceneVariableSet({
    variables: [users, gpus],
  })

  const queryRunner = (serverId: VariableValueSingle, gpu: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
      datasource: SQL_DATASOURCE_2,
      
      refId: 'A',
      format: "time_series",
      rawSql: `SELECT $__timeGroup(RecordTimeCreated, '5m', 0) as time, gr.MemoryUsage as MemoryUsage, u.login
      FROM GpuReceipt gr 
      JOIN Gpu g ON g.ID = gr.GpuID
      JOIN User u ON u.ID = gr.UserID 
      WHERE MachineId = '${serverId}' AND u.login IN ($userGpu) AND g.UUID = '${gpu}' AND $__timeFilter(RecordTimeCreated)
      ORDER BY time`,
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
    ],
  });

  
  const scene = new EmbeddedScene({
    $variables: variableSet,
    body: new SceneByVariableRepeater({
      variableName: 'gpu' + serverId,
      getLayoutChild: (option) => {
        return new SceneFlexLayout({
          children: [
            new SceneFlexItem({
              $data: transformedData(queryRunner(serverId, option.value)),
              $behaviors: [new ShowBasedOnConditionBehavior({
                references: ["toggle"],
                condition: (toggle: SceneRadioToggle) => {
                  return toggle.state.value === "visible" 
                }
              })],

              minHeight: 250,
              
              body: getPanel(option.value).setHeaderActions(new SceneDataLayerControls()).build(),
            })
          ]
        })
      },
      body: new SceneFlexLayout({
        direction: "column",
        children: []
      }),
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

const getPanel = (gpu: VariableValueSingle) => { 
  
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
                      .setUnit("MB").setTitle(gpu + ' Memory Usage')
}
/*
function getGpuTimeseries(){


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
  const layout = new SceneFlexLayout({
    direction: "column",
    minHeight: 300,
    children: []
  });
  layout.subscribeToState((state) => {
    const selectedOptions = state.$variables?.getByName("gpu")?.getValue()?.toString().split(",").sort()
    state.children = selectedOptions !== undefined ?
      selectedOptions?.map((option) => {
        return new SceneFlexItem({
          $data: new SceneDataLayers({
            layers: [globalAnnotations(option)]
          }),
          body: getPanel(option).setHeaderActions(new SceneDataLayerControls()).build(),
        });
      }) : [ 
        new SceneFlexItem({
          body: new SceneCanvasText({
            align: 'center',
            text: `Please select GPU first`,
            fontSize: 30,
          }),
        }),
      ]
  })
  
  return layout;
}
*/


