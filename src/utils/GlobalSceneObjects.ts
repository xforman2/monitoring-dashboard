import { EmbeddedScene, QueryVariable, SceneApp, SceneAppPage, SceneRefreshPicker, SceneTimePicker, SceneVariableSet, VariableValueSingle, behaviors } from "@grafana/scenes";
import { DashboardCursorSync, VariableHide } from "@grafana/schema";
import { SQL_DATASOURCE_2 } from "./../constants";
import { getLoadingPage } from "./LoadingPage";

export interface SceneMetaData {
    title: string,
    description: string,
    route: string
}

export type GetSceneFunction = (serverId: VariableValueSingle, server: string) => EmbeddedScene;

export const servers = new QueryVariable({
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

export const getAppScene = (sceneMetaData: SceneMetaData, getScene: GetSceneFunction) => {
    const appServers = servers.clone()
    const page = new SceneAppPage({
        $behaviors: [new behaviors.CursorSync({
        sync: DashboardCursorSync.Crosshair
        })],
        $variables: new SceneVariableSet({
        variables: [appServers]
        }),
        title: sceneMetaData.title,
        controls: [new SceneTimePicker({ isOnCanvas: true }),
                    new SceneRefreshPicker({})],
        url: sceneMetaData.route,
        hideFromBreadcrumbs: false,
        tabs: [],
        getFallbackPage: getLoadingPage
    })

    page.addActivationHandler(() => {
        const sub = appServers.subscribeToState((state) => {
        if (state.loading === false && state.options){
            page.setState({
            
            tabs: state.options.map((option) => {
                return getTab(sceneMetaData.route, option.label, option.value, getScene) 
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

export function getTab(route: string, server: string, serverId: VariableValueSingle, getScene: GetSceneFunction){
    return new SceneAppPage({
        title: `${server}`,
        url: `${route}/${server}`,
        getScene: () => getScene(serverId, server)
    })
}

export function cancelLoadingPage(page: SceneAppPage){
    const cancel = setTimeout(() => {
      page.setState({
        getFallbackPage: undefined,
      });
    }, 2000);
    return () => clearTimeout(cancel);
}
