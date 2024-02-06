import { EmbeddedScene,  
  SceneApp,
  SceneAppPage,
  SceneTimePicker,
  SceneDataTransformer,
  SceneGridLayout,
  SceneGridItem,
  SceneVariableSet,
  VariableValueSelectors,
  PanelBuilders,
  QueryVariable,
  VariableValueSingle,
  SceneQueryRunner,
  SceneRefreshPicker,
  behaviors,
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE_2 } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { DashboardCursorSync, LegendDisplayMode, SortOrder, TooltipDisplayMode, VariableHide, VisibilityMode } from '@grafana/schema';
import { cancelLoadingPage, getLoadingPage } from 'utils/LoadingPage';

export const getProcessAppScene = () => {
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
    $behaviors: [new behaviors.CursorSync({sync: DashboardCursorSync.Tooltip })],
    title: 'Process Details Dashboard',
    controls: [new SceneTimePicker({ isOnCanvas: true }),
               new SceneRefreshPicker({})],
    url: prefixRoute(`${ROUTES.ProcessDetails}`),
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
    url: prefixRoute(`${ROUTES.ProcessDetails}/${server}`),
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
      isMulti: false,
      includeAll: false
  });
  
  
  const gpuCountQuery = (text: VariableValueSingle) => new SceneQueryRunner({
      queries: 
      [{
          datasource: SQL_DATASOURCE_2,
          refId: 'A',
          format: "time_series",
          rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, pe.GpuCount
          FROM ProcessRecord pe
          JOIN User u ON Id = UserId
          WHERE MachineId = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
          ORDER BY time`
      }],

  });

    
  const nicenessQuery = (text: VariableValueSingle) => new SceneQueryRunner({
      queries: 
      [{
          datasource: SQL_DATASOURCE_2,
          refId: 'A',
          format: "time_series",
          rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, pe.Niceness
          FROM ProcessRecord pe
          JOIN User ON Id = UserId
          WHERE MachineId = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
          ORDER BY time`
      }],

  });
  
  const vramQuery = (text: VariableValueSingle) => new SceneQueryRunner({
      queries: 
      [{
          datasource: SQL_DATASOURCE_2,
          refId: 'A',
          format: "time_series",
          rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, pe.OverallGPUVram
          FROM ProcessRecord pe
          JOIN User ON Id = UserId
          JOIN Machine m ON MachineId = m.ID
          WHERE MachineId = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
          ORDER BY time`
      }],

  });

  const cpuTimeQuery = (text: VariableValueSingle) => new SceneQueryRunner({
      queries: 
      [{
          datasource: SQL_DATASOURCE_2,
          refId: 'A',
          format: "time_series",
          rawSql: `SELECT $__timeGroup(UserRecordTimeCreated, '5m', 0) as time, Command, TIME_TO_SEC(pe.CPUTime) as CPUTime
          FROM ProcessRecord pe
          JOIN User ON Id = UserId
          JOIN Machine m ON MachineId = m.ID
          WHERE MachineId = '${text}' AND login = '$user' AND $__timeFilter(UserRecordTimeCreated) 
          ORDER BY time`
      }],

  });
  


  const transformedData = (query: SceneQueryRunner, field: string) => new SceneDataTransformer({
      $data: query,
      transformations: [
          {
          id: 'renameByRegex',
          options: {
              regex: `${field} (.*)`,
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

  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [users]
    }),
    body: new SceneGridLayout({
      isDraggable: true,
      isLazy: true,
      children: [
        new SceneGridItem({
          x: 0,
          y: 0,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(vramQuery(serverId), 'OverallGPUVram'))
            .setTitle("Overall GPU VRAM Used by Process")
            .setUnit("MB")
            .build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 0,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(nicenessQuery(serverId), 'Niceness'))
            .setTitle("Niceness of Process")
            .build(),
        }),
        new SceneGridItem({
          x: 0,
          y: 8,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(gpuCountQuery(serverId), 'GpuCount'))
            .setTitle("Number of GPUs occupied by process")
            .build(),
        }),
        new SceneGridItem({
          x: 12,
          y: 8,
          width: 12,
          height: 8,
          body: getProcessTimeseries(transformedData(cpuTimeQuery(serverId), 'CPUTime'))
            .setTitle("CPU Time of process").setUnit("s")
            .build(),
        }),
        
        
      ]
    }),  
    controls: [new VariableValueSelectors({})],
  });
}

function getProcessTimeseries(data: SceneDataTransformer) {
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
  .setData(data)
                          
}
