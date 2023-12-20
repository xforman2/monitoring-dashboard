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
import { cpuTimeQuery, gpuCountQuery, nicenessQuery, transformedData, users, vramQuery } from './queries';

function getProcessTimeseries(data: SceneDataTransformer) {
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
  .setData(data)
                          
}

function getGridRow(title: string, difference: number){

  return new SceneGridRow({
    title: title,
    x: 0,
    y: 0 + difference,
    children: [
      new SceneGridItem({
        x: 0,
        y: 0 + difference,
        width: 12,
        height: 8,
        body: getProcessTimeseries(transformedData(vramQuery(title), 'OverallGPUVram'))
          .setTitle("Overall GPU VRAM Used by Process")
          .setUnit("MB")
          .build(),
      }),
      new SceneGridItem({
        x: 12,
        y: 0 + difference,
        width: 12,
        height: 8,
        body: getProcessTimeseries(transformedData(nicenessQuery(title), 'Niceness'))
          .setTitle("Niceness of Process")
          .build(),
      }),
      new SceneGridItem({
        x: 0,
        y: 8 + difference,
        width: 12,
        height: 8,
        body: getProcessTimeseries(transformedData(gpuCountQuery(title), 'GpuCount'))
          .setTitle("Number of GPUs occupied by process")
          .build(),
      }),
      new SceneGridItem({
        x: 12,
        y: 8 + difference,
        width: 12,
        height: 8,
        body: getProcessTimeseries(transformedData(cpuTimeQuery(title), 'CPUTime'))
          .setTitle("CPU Time of process").setUnit("s")
          .build(),
      }),
    ],
  })
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
        getGridRow("alfa", 0),
        getGridRow("beta", 16)
        
        
      ]
    }),  
    controls: [new VariableValueSelectors({})],
  });
}

export const getProcessAppScene = () => {
  return new SceneApp({
    pages: [
    new SceneAppPage({
      title: 'Process Details Dashboard',
      controls: [new SceneTimePicker({ isOnCanvas: true })],
      url: prefixRoute(`${ROUTES.ProcessDetails}`),
      hideFromBreadcrumbs: false,
      getScene,
    })]
  })
}
