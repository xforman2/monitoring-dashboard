import { SceneFlexItem, SceneFlexLayout, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';

export class HiddenLayoutItemBehavior<
  TState extends SceneObjectState = SceneObjectState
> extends SceneObjectBase<TState> {
  public constructor(state: TState) {
    super(state);
  }

  protected setHidden() {
    const parentLayoutItem = getClosestLayoutItem(this);

    if (!parentLayoutItem.state.isHidden) {
      parentLayoutItem.setState({ isHidden: true });
    }
  }

  protected setVisible() {
    const parentLayoutItem = getClosestLayoutItem(this);

    if (parentLayoutItem.state.isHidden) {
      parentLayoutItem.setState({ isHidden: false });
    }
  }
  protected isHidden(){
    const parentLayoutItem = getClosestLayoutItem(this);
    return parentLayoutItem.state.isHidden;
  }
  
}
function getClosestLayoutItem(obj: SceneObject): SceneFlexItem | SceneFlexLayout {
  if (obj instanceof SceneFlexItem || obj instanceof SceneFlexLayout) {
    return obj;
  }

  if (!obj.parent) {
    throw new Error('Could not find parent flex item');
  }

  return getClosestLayoutItem(obj.parent);
}
