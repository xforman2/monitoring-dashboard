import { EmbeddedScene,  
  PanelBuilders,
  QueryVariable, 
  //SceneVariableSet, 
 // VariableValueSelectors, 
  SceneQueryRunner,
  SceneApp,
  SceneAppPage,
  SceneTimePicker,
  SceneDataTransformer,
  SceneGridLayout,
  SceneGridItem,
  SceneGridRow,
  SceneVariableSet,
  VariableValueSelectors,
  //SceneByFrameRepeater,
  //SceneDataNode,
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
//import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';

const users = new QueryVariable({
  name: 'user',
  label: 'User Name',
  datasource: SQL_DATASOURCE,
  query: "SELECT xlogin from User",
  sort: 1,
  isMulti: true,
  includeAll: true
});

const servers = new QueryVariable({
  name: 'server',
  label: 'Server',
  datasource: SQL_DATASOURCE,
  query: "SELECT Mac from Machine",
  sort: 1,
  isMulti: false,
  includeAll: true
});


const queryRunner = new SceneQueryRunner({
  queries: 
  [{
    datasource: SQL_DATASOURCE,
    refId: 'A',
    format: "time_series",
    rawSql: `SELECT TimeCreated as time, ur.PCPU, u.FullName
    FROM UserRecord ur
    JOIN User u ON ur.UserID = u.ID
    WHERE MachineMac IN ($server) AND u.xlogin IN ($user) AND $__timeFilter(TimeCreated) 
    ORDER BY time`
  }],
  
});

const transformedData = new SceneDataTransformer({
  $data: queryRunner,
  transformations: [
    {
      id: 'renameByRegex',
      options: {
        regex: 'PCPU(.*)',
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

export function getScene() {
  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [servers, users]
    }),
    body: new SceneGridLayout({
      isDraggable: true,
      isLazy: true,
      children: [
        new SceneGridRow({
          title: "Server A",
          x: 0,
          y: 0,
          width: 12,
          height: 8,
          children: [
            new SceneGridItem({
              width: 24,
              height: 10,
              body: PanelBuilders.timeseries().setData(transformedData).build()
            })
          ]
        })
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}

export const getCpuAppScene = () => {
  return new SceneApp({
    pages: [
    new SceneAppPage({
      title: 'CPU Dashboard',
      controls: [new SceneTimePicker({ isOnCanvas: true })],
      url: prefixRoute(`${ROUTES.Cpu}`),
      hideFromBreadcrumbs: true,
      getScene,
    })]
  })
}
