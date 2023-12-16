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
import { LegendDisplayMode, SortOrder, TooltipDisplayMode, VisibilityMode } from '@grafana/schema';
import { ramQuery, transformedData, users } from './queries';

function getRamTimeseries(data: SceneDataTransformer) {
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
  .setData(data).setTitle("RAM %").setUnit("%")
                          
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
          width: 12,
          height: 8,
          children: [
            new SceneGridItem({
              width: 24,
              height: 8,
              body: getRamTimeseries(transformedData(ramQuery('alfa'), 'PMEM')).build()
            }),
          ]
        }),
        new SceneGridRow({
          title: "beta",
          x: 0,
          y: 0,
          width: 12,
          height: 8,
          children: [
            new SceneGridItem({
              width: 24,
              height: 8,
              body: getRamTimeseries(transformedData(ramQuery('beta'), "PMEM")).build()
            }),
          ]
        })
      ]
    }),
    controls: [new VariableValueSelectors({})],
  });
}

export const getRamAppScene = () => {
  return new SceneApp({
    pages: [
    new SceneAppPage({
      title: 'RAM Dashboard',
      controls: [new SceneTimePicker({ isOnCanvas: true })],
      url: prefixRoute(`${ROUTES.Ram}`),
      hideFromBreadcrumbs: true,
      getScene,
    })]
  })
}
