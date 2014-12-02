/// <reference path="refs.d.ts" />

class ToolbarItemCollection extends Backbone.Collection<ToolbarItem> {
  constructor() {
    super();

    var items:string[] = Editor.toolbarNames;

    for (var i = 0; i < items.length; i++) {
      var item:ToolbarItem = new ToolbarItem();
      item.set('name', items[i]);

      this.add(item);
    }
  }
}

class ToolbarItem extends Backbone.Model {

}

class ToolbarItemView extends MagicView<ToolbarItem> {
  template:Template = F.loadTemplate('tool');
  dialog:DialogWidget;

  events() {
    return {
      'click a': 'switchTool'
    }
  }

  switchTool() {
    this.trigger('switch-tool', this.model);

    // TODO:: not in the right place...hah
    /*
    this.dialog = new DialogWidget({
      title: 'Add Game Entity',
      body: 'Lets add a game entity!',
      buttons: [{
        title: 'Ok!'
      }, {
        title: 'Cancel',
        type: "btn-danger",
        clickCallback: () => { console.log(' you cancelled... ya dumb'); }
      }]
    });
    this.dialog.render().$el.appendTo(this.$el);
    */

    return false;
  }
}

class ToolSettingsView extends MagicView<Backbone.Model> {
  private _visible:boolean = false;

  set visible(val:boolean) {
    this._visible = val;

    this.$el.toggle(this._visible);
  }
}

class InspectorProperties extends ToolSettingsView {
  template:Template = F.loadTemplate('inspector-properties');
}

class AddItemProperties extends ToolSettingsView {
  template:Template = F.loadTemplate('add-item-properties');
}

class ToolProperties extends MagicView<Backbone.Model> {
  template:Template = F.loadTemplate('tool-properties');
  _selectedTool:ToolbarItem;

  subviews():SubviewList {
    return {
      '.inspector-properties': (_attrs) => { return new InspectorProperties(_attrs); },
      '.add-item-properties': (_attrs) => { return new AddItemProperties(_attrs); }
    };
  }

  render():Backbone.View<Backbone.Model> {
    super.render();

    for (var subviewName in this.subviewObjects) {
      (<ToolSettingsView> this.subviewObjects[subviewName]).visible = false;
    }

    return this;
  }

  modelToClassName(tool:ToolbarItem) {
    switch (tool.get('name')) {
      case 'Inspect':
        return '.inspector-properties';
        break;
      case 'Add Item':
        return '.add-item-properties';
        break;
      default:
        throw 'idk';
        break;
    }
  }

  set selectedTool(tool:ToolbarItem) {
    if (this._selectedTool) {
      (<ToolSettingsView> this.getSubview(this.modelToClassName(this._selectedTool))).visible = false;
    }

    this._selectedTool = tool;

    (<ToolSettingsView> this.getSubview(this.modelToClassName(tool))).visible = true;
  }
}

class SelectedToolView extends MagicView<ToolbarItem> {
  template:Template = F.loadTemplate('selected-tool')
}

class Toolbar extends MagicListView<Backbone.Model> {
  private _selectedTool:ToolbarItem;

  template:Template = F.loadTemplate('toolbar');
  subview(): typeof MagicView { return ToolbarItemView; }
  subviews():SubviewList {
    return {
      '.selected-tool': (_attrs) => { return new SelectedToolView(F.merge(_attrs, { model: this._selectedTool })); }
    };
  }

  constructor(attrs:any) {
    super(attrs);

    this._selectedTool = this.collection.first();
  }

  set selectedTool(val:ToolbarItem) {
    this._selectedTool = val;

    this.render();
  }

  get selectedTool():ToolbarItem {
    return this._selectedTool;
  }
}
