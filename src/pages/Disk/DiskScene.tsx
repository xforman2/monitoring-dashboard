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
  SceneRefreshPicker,
  VariableValueSingle,
  SceneQueryRunner,
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE_2 } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VariableHide} from '@grafana/schema';
import { cancelLoadingPage, getLoadingPage } from 'utils/LoadingPage';

export const getDiskAppScene = () => {
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
    title: 'Disk Dashboard',
    controls: [new SceneTimePicker({ isOnCanvas: true }),
               new SceneRefreshPicker({})],
    url: prefixRoute(`${ROUTES.Disk}`),
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
    url: prefixRoute(`${ROUTES.Disk}/${server}`),
    getScene: () => getScene(serverId)
  })
}
function getDiskTimeline(data: SceneDataTransformer) {
  return PanelBuilders.statetimeline()
  .setOption("legend", {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: "right",
    })
  .setOption("tooltip", {
    mode: TooltipDisplayMode.Multi,
    sort: SortOrder.Descending
  })
  .setData(data)
                          
}


export function getScene(serverId: VariableValueSingle) {

  const users = new QueryVariable({
    name: 'userDisk',
    label: 'User Name',
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
        rawSql: `SELECT TimeCreated as time, UserLogin, BlocksUsed
        FROM UserDiskUsage du
        WHERE BlocksUsed IS NOT NULL AND MachineId = '${text}' AND UserLogin IN ($userDisk) AND $__timeFilter(TimeCreated) 
        ORDER BY time`
    }],

  });

  const filesQuery = (text: VariableValueSingle) => new SceneQueryRunner({
      queries: 
      [{
          datasource: SQL_DATASOURCE_2,
          refId: 'A',
          format: "time_series",
          rawSql: `SELECT TimeCreated as time, UserLogin, FilesUsed
          FROM UserDiskUsage du
          WHERE FilesUsed IS NOT NULL AND MachineId = '${text}' AND UserLogin  IN ($userDisk) AND $__timeFilter(TimeCreated) 
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
    body:
     new SceneGridLayout({
      isDraggable: true,
      isLazy: true,
      children: [

          new SceneGridItem({
            x: 0,
            y: 0,
            width: 24,
            height: 14,
            body: getDiskTimeline(transformedData(diskQuery(serverId), 'BlocksUsed'))
            .setTitle("Disk Usage").build()
          }),
          new SceneGridItem({
            x:0,
            y:14,
            width: 24,
            height: 14,
            body: getDiskTimeline(transformedData(filesQuery(serverId), 'FilesUsed'))
            .setTitle("Number of Files").build()
          }),
        
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}

