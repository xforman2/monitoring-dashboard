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
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE_2 } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { GraphDrawStyle, LegendDisplayMode, SortOrder,StackingMode,TooltipDisplayMode, VariableHide, VisibilityMode } from '@grafana/schema';
import { cancelLoadingPage, getLoadingPage } from 'utils/LoadingPage';


export const getCpuAppScene = () => {
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
    title: 'CPU Dashboard',
    controls: [new SceneTimePicker({ isOnCanvas: true }),
               new SceneRefreshPicker({})],
    url: prefixRoute(`${ROUTES.Cpu}`),
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
    url: prefixRoute(`${ROUTES.Cpu}/${server}`),
    getScene: () => getScene(serverId)
  })
}
export function getScene(serverId: VariableValueSingle) {
  const users = new QueryVariable({
    name: 'userCpu',
    label: 'User Name',
    datasource: SQL_DATASOURCE_2,
    query: "SELECT login from User",
    sort: 5,
    isMulti: true,
    includeAll: true,
    defaultToAll: true,
    maxVisibleValues: 2
});
  
  
const pcpuQuery = (text: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.PCPU, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

const cpuTimeQuery = (text: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, TIME_TO_SEC(ur.CPUTime) as CPUTime, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

const highCpuTimeQuery = (text: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.HighCpuTime, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

const processCountQuery = (text: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.ProcessCount, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

});

const sleepingProcessesQuery = (text: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.IOSleeping, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        WHERE  MachineId = '${text}' AND u.login IN ($userCpu) AND $__timeFilter(TimeCreated) 
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
              x:0,
              y:0,
              width: 24,
              height: 8,
              body: getCpuTimeseries(transformedData(pcpuQuery(serverId), 'PCPU'), "CPU %").setUnit("%").build()
            }),
            new SceneGridItem({
              x:0,
              y:8,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(cpuTimeQuery(serverId), 'CPUTime'), "CPU Time").setUnit("s")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({

              x:12,
              y:8,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(highCpuTimeQuery(serverId), 'HighCpuTime'), "High Cpu Time").setUnit("s")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              x:0,
              y:16,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(processCountQuery(serverId), 'ProcessCount'), "Process Count")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              x: 12,
              y:16,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(sleepingProcessesQuery(serverId), 'IOSleeping'), "Sleeping Processes")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
          ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}


function getCpuTimeseries(data: SceneDataTransformer, title: string) {
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
  .setData(data).setTitle(title)
}
