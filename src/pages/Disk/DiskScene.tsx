import { EmbeddedScene,  
  SceneApp,
  SceneAppPage,
  SceneTimePicker,
  SceneDataTransformer,
  SceneGridLayout,
  SceneGridItem,
  SceneGridRow,
  SceneVariableSet,
  VariableValueSelectors,
  PanelBuilders,
} from '@grafana/scenes';

import { ROUTES } from '../../constants';
import { prefixRoute } from 'utils/utils.routing';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode} from '@grafana/schema';
import { diskQuery, filesQuery, transformedData, users } from './queries';

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


export function getScene() {
  return new EmbeddedScene({
    $variables: new SceneVariableSet({
      variables: [users]
    }),
    body: new SceneGridLayout({
      isDraggable: true,
      isLazy: true,
      children: [
        new SceneGridRow({
          title: "alfa",
          x: 0,
          y: 0,
          children: [
            new SceneGridItem({
              width: 24,
              height: 14,
              body: getDiskTimeline(transformedData(diskQuery('alfa'), 'DiskSpace'))
              .setTitle("Disk Usage").setUnit("GB").build()
            }),
            new SceneGridItem({
              width: 24,
              height: 14,
              body: getDiskTimeline(transformedData(filesQuery('alfa'), 'Files'))
              .setTitle("Number of Files").build()
            }),
          ]
        }),
        new SceneGridRow({
          title: "beta",
          x: 0,
          y: 0,
          children: [
            new SceneGridItem({
              width: 24,
              height: 14,
              body: getDiskTimeline(transformedData(diskQuery('beta'), "DiskSpace"))
              .setTitle("Disk Usage").setUnit("GB").build()
            }),
            new SceneGridItem({
              width: 24,
              height: 14,
              body: getDiskTimeline(transformedData(filesQuery('beta'), "Files"))
              .setTitle("Number of Files").build()
            }),
          ]
        })
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}

export const getDiskAppScene = () => {
  return new SceneApp({
    pages: [
    new SceneAppPage({
      title: 'Disk Dashboard',
      controls: [new SceneTimePicker({ isOnCanvas: true })],
      url: prefixRoute(`${ROUTES.Disk}`),
      hideFromBreadcrumbs: false,
      getScene,
    })]
  })
}
