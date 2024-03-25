import { EmbeddedScene, SceneAppPage, SceneReactObject } from "@grafana/scenes";
import React from "react";

export const getLoadingPage = () =>{
  return new SceneAppPage({
      title: 'Loading...',
      url: '',
      getScene: () =>
        new EmbeddedScene({
          body: new SceneReactObject({
            component: () => <p>Please wait...</p>,
          }),
        }),
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





