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
import { cpuTimeQuery, highCpuTimeQuery, pcpuQuery, processCountQuery, sleepingProcessesQuery, transformedData, users } from './queries';
import { GraphDrawStyle, LegendDisplayMode, SortOrder,StackingMode,TooltipDisplayMode, VisibilityMode } from '@grafana/schema';

function getCpuTimeseries(data: SceneDataTransformer, title: string) {
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
  .setData(data).setTitle(title)
  
                          
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
              body: getCpuTimeseries(transformedData(pcpuQuery('alfa'), 'PCPU'), "CPU %").setUnit("%").build()
            }),
            new SceneGridItem({
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(cpuTimeQuery('alfa'), 'CPUTime'), "CPU Time").setUnit("s")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              x:12,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(highCpuTimeQuery('alfa'), 'HighCpuTime'), "High Cpu Time").setUnit("s")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(processCountQuery('alfa'), 'ProcessCount'), "Process Count")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              x: 12,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(sleepingProcessesQuery('alfa'), 'IOSleeping'), "Sleeping Processes")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            })
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
              body: getCpuTimeseries(transformedData(pcpuQuery('beta'), 'PCPU'), "CPU %").setUnit("%").build()
            }),
            new SceneGridItem({
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(cpuTimeQuery('beta'), 'CPUTime'), "CPU Time").setUnit("s")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              x:12,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(highCpuTimeQuery('beta'), 'HighCpuTime'), "High Cpu Time").setUnit("s")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(processCountQuery('beta'), 'ProcessCount'), "Process Count")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
            }),
            new SceneGridItem({
              x: 12,
              width: 12,
              height: 8,
              body: getCpuTimeseries(transformedData(sleepingProcessesQuery('beta'), 'IOSleeping'), "Sleeping Processes")
                  .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars).setCustomFieldConfig('fillOpacity', 100)
                  .setCustomFieldConfig('stacking',{mode: StackingMode.Normal}).build()
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
      hideFromBreadcrumbs: false,
      getScene,
    })]
  })
}
