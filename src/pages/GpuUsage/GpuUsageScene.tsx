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
  //SceneByFrameRepeater,
  //SceneDataNode,
} from '@grafana/scenes';

import { ROUTES, SQL_DATASOURCE } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VisibilityMode } from '@grafana/schema';

const users = new QueryVariable({
  name: 'user',
  label: 'User Name',
  datasource: SQL_DATASOURCE,
  query: "SELECT xlogin from User",
  sort: 1,
  isMulti: true,
  includeAll: true
});

const queryRunner = (text: string) => new SceneQueryRunner({
  queries: 
  [{
    datasource: SQL_DATASOURCE,
    refId: 'A',
    format: "time_series",
    rawSql: `SELECT UserRecordTimeCreated as time, gr.MemoryUsage as MemoryUsage, u.XLogin
    FROM GpuReceipts gr 
    JOIN Gpu g ON g.UUID = gr.GPUUUID
    JOIN User u ON u.ID = gr.UserRecordUserID
    WHERE u.xlogin IN ($user) AND g.UUID = '${text}' AND $__timeFilter(UserRecordTimeCreated)
    ORDER BY time`
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

export function getScene() {
  return new EmbeddedScene({
  $variables: new SceneVariableSet({
    variables: [users],
  }),
  body: new SceneFlexLayout({
  children: [
    getGpuTimeseries()
  ],
  }),
  controls: [new VariableValueSelectors({})],
  });
}

export const getGpuUsageAppScene = () => {
  return new SceneApp({
    pages: [
    new SceneAppPage({
      title: 'GPU Dashboard',
      controls: [new SceneTimePicker({ isOnCanvas: true })],
      url: prefixRoute(`${ROUTES.GpuUsage}`),
      hideFromBreadcrumbs: false,
      getScene,
    })]
  })
}

export function getGpuTimeseries() {
  const getPanel = (text: string) => { 
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
                        .setUnit("MB").setData(transformedData(text)).setTitle(text + ' MemoryUsage')
  }

  const gpu001 = getPanel("GPU001")
  const gpu002 = getPanel("GPU002")
  const gpu003 = getPanel("GPU003")
  const gpu004 = getPanel("GPU004")
  const gpu005 = getPanel("GPU005")
  const gpu006 = getPanel("GPU006")
  const gpu007 = getPanel("GPU007")
  const gpu008 = getPanel("GPU008")
  
  return new SceneFlexLayout({
    direction: "column",
    minHeight: 300,
    children: [
      new SceneFlexItem({
        body: gpu001.build(),
      }),
      new SceneFlexItem({
        body: gpu002.build(),
      }),
      new SceneFlexItem({
        body: gpu003.build(),
      }),
      new SceneFlexItem({
        body: gpu004.build(),
      }),
      new SceneFlexItem({
        body: gpu005.build(),
        
      }),
      new SceneFlexItem({
        body: gpu006.build(),
        
      }),
      new SceneFlexItem({
        body: gpu007.build(),
        
      }),
      new SceneFlexItem({
        body: gpu008.build(),
        
      })
    ]
  });

}
