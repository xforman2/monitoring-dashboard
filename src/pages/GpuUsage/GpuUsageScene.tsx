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
  sceneGraph,
  VariableValueSingle,
  SceneReactObject
  
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE_2 } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VariableHide, VisibilityMode} from '@grafana/schema';
import { AnnotationEventFieldSource } from '@grafana/data';
import React from 'react';
import { SceneRadioToggle } from 'utils/SceneRadioToggle';
import { ShowBasedOnConditionBehavior } from 'utils/ShowBasedOnConditionBehavior';

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
    controls: [new SceneTimePicker({ isOnCanvas: true })],
    url: prefixRoute(`${ROUTES.GpuUsage}`),
    hideFromBreadcrumbs: false,
    tabs: [],
    getFallbackPage: () =>
      new SceneAppPage({
        title: 'Loading...',
        url: '',
        getScene: () =>
          new EmbeddedScene({
            body: new SceneReactObject({
              component: () => <p>Please wait...</p>,
            }),
          }),
      }),
  })
  servers.subscribeToState((state) => {
    if (state.loading === false && state.options){
      page.setState({
        tabs: state.options.map((option) => {
          return getTab(option.label, option.value) 
        })
      })
    }
    
  })

  page.addActivationHandler(() => {
    if (page.state.tabs!.length === 0) {
      const cancel = setTimeout(() => {
        page.setState({
          getFallbackPage: undefined,
        });
      }, 2000);
      return () => clearTimeout(cancel);
    }

    return;
  });

  return new SceneApp({
    pages: [page]
  })
}

export function getTab(server: string, serverId: VariableValueSingle){
  return new SceneAppPage({
    title: `${server}`,
    url: prefixRoute(`${ROUTES.GpuUsage}/${server}`),
    getScene: () => getScene(serverId)
  })
}

export function getScene(serverId: VariableValueSingle) {

  const users = new QueryVariable({
    name: 'user',
    label: 'User Name',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT login from User",
    sort: 1,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
    defaultToAll: true
  
  });
  const gpus = new QueryVariable({
    name: 'gpu',
    label: 'GPU',
    datasource: SQL_DATASOURCE_2,
    query: `SELECT UUID from Gpu WHERE MachineID = ${serverId} `,
    sort: 1,
    isMulti: true,
    includeAll: true,
    maxVisibleValues: 2,
    defaultToAll: true
  });

  const variableSet = new SceneVariableSet({
    variables: [users, gpus],
  })
  const scene = new EmbeddedScene({
    $behaviors: [],
    $variables: variableSet,
    body: new SceneFlexLayout({
      children: []
    }),
    controls: [new VariableValueSelectors({}),
               new SceneDataLayerControls(),
              new SceneRadioToggle({
                key: "toggle",
                options: [
                  { value: 'visible', label: 'Show no data panels' },
                  { value: 'hidden', label: 'Hide no data panels' },
                ],
                value: 'visible',
              })],
  })
  gpus.subscribeToState((state) => {
    const queryRunner = (serverId: VariableValueSingle, gpu: string) => new SceneQueryRunner({
      queries: 
      [{
        datasource: SQL_DATASOURCE_2,
        
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT RecordTimeCreated as time, gr.MemoryUsage as MemoryUsage, u.login
        FROM GpuReceipt gr 
        JOIN Gpu g ON g.ID = gr.GpuID
        JOIN User u ON u.ID = gr.UserID 
        WHERE MachineId = '${serverId}' AND u.login IN ($user) AND g.UUID = '${gpu}' AND $__timeFilter(RecordTimeCreated)
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
        },
      ],
    });
    let selectedOptions: string[] = []
    const gpuVariable = sceneGraph.getVariables(scene).getByName("gpu")  
    if (gpuVariable){
      // @ts-ignore
       selectedOptions = gpuVariable.getValueText().toString().split(" + ").sort()
    }
    
    if (selectedOptions[0] === "All") {
      selectedOptions = state.options.map((option) => option.label)

    }
    scene.setState({
      body: new SceneFlexLayout({
        direction: "column",
        children: selectedOptions.map((option) => {
          return new SceneFlexItem({
            $data: transformedData(queryRunner(serverId, option)),
            $behaviors: [new ShowBasedOnConditionBehavior({
              references: ["toggle"],
              condition: (toggle: SceneRadioToggle) => {
                 return toggle.state.value === "visible" 
              }
            })],
            minHeight: 250,
            
            body: getPanel(option).setHeaderActions(new SceneDataLayerControls()).build(),
          });
        })
      })
    })
  })
  return scene;
}

const getPanel = (gpu: string) => { 
  
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
    console.log("here")
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


