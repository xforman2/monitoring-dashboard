import { EmbeddedScene, QueryVariable, SceneAppPage, SceneRefreshPicker, SceneTimePicker, SceneTimeRange, SceneVariableSet, VariableValueSingle, behaviors } from "@grafana/scenes";
import { DashboardCursorSync, VariableHide } from "@grafana/schema";
import { SQL_DATASOURCE_2 } from "../constants";
import { getLoadingPage } from "./LoadingFallbackPage";
import { ReactNode } from "react";

export interface PageProps {
    title: string,
    description: string | ReactNode,
    route: string
    timeRange: SceneTimeRange
}

export interface PanelMetaData{
    title: string,
    description: string,
    unit: string
    min?: number
    max?: number
    noValue: string

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

export const getAppPage = (pageProps: PageProps, getScene: GetSceneFunction) => {
    const appServers = servers.clone()
    const page = new SceneAppPage({
        $timeRange: pageProps.timeRange,
        $behaviors: [new behaviors.CursorSync({
        sync: DashboardCursorSync.Crosshair
        })],
        $variables: new SceneVariableSet({
        variables: [appServers]
        }),
        title: pageProps.title,
        subTitle: pageProps.description,
        
        controls: [new SceneTimePicker({ isOnCanvas: true }),
                    new SceneRefreshPicker({refresh: "5m"})],
        url: pageProps.route,
        hideFromBreadcrumbs: false,
        tabs: [],
        getFallbackPage: getLoadingPage
    })

    page.addActivationHandler(() => {
        const sub = appServers.subscribeToState((state) => {
        if (state.loading === false && state.options){
            page.setState({
            
            tabs: state.options.map((option) => {
                return getTab(pageProps.route, option.label, option.value, getScene) 
            })
            })
        }
        
        })
        return () => sub.unsubscribe();
    });

    page.addActivationHandler(() => {
        cancelLoadingPage(page)
    })
    return page;
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
