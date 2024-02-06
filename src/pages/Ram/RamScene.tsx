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

export const getRamAppScene = () => {
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
    title: 'RAM Dashboard',
    controls: [new SceneTimePicker({ isOnCanvas: true }),
               new SceneRefreshPicker({})],
    url: prefixRoute(`${ROUTES.Ram}`),
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
    url: prefixRoute(`${ROUTES.Ram}/${server}`),
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
    defaultToAll: true
  });
  
  
const ramQuery = (serverId: VariableValueSingle) => new SceneQueryRunner({
    queries: 
    [{
        datasource: SQL_DATASOURCE_2,
        refId: 'A',
        format: "time_series",
        rawSql: `SELECT $__timeGroup(TimeCreated, '5m', 0) as time, ur.PMEM, u.login
        FROM UserRecord ur
        JOIN User u ON ur.UserID = u.ID
        WHERE  MachineId = '${serverId}' AND u.login IN ($user) AND $__timeFilter(TimeCreated) 
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
          x: 0,
          y: 0,
          width: 24,
          height: 8,
          body: getRamTimeseries(transformedData(ramQuery(serverId), 'PMEM')).build()
        }),
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}

function getRamTimeseries(data: SceneDataTransformer) {
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
  .setData(data).setTitle("RAM %").setUnit("%")
                          
}
