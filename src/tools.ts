/// <reference path="refs.d.ts" />

enum ToolType { Inspector, AddItem };

class ToolbarTypeHelpers {
  static toolToString(tool:ToolType):string {
    return ToolType[tool];
  }
  static toolTemplate(tool:ToolType):string {
    return ToolbarTypeHelpers.toolToString(tool).toLowerCase().replace(/ /g, "-");
  }

  static elName(tool:ToolType):string {
    return "." + ToolbarTypeHelpers.toolTemplate(tool);
  }

  static classType(tool:ToolType):typeof ToolSettingsView {
    // dang it! maybe someone smarter than me can figure this out

    switch (tool) {
      case ToolType.Inspector: return InspectorProperties;
      case ToolType.AddItem: return AddItemProperties;
      default: throw "unrecognized tool type";
    }
  }
}

class ToolbarItemCollection extends Backbone.Collection<ToolbarItem> {
  constructor() {
    super();

    for (var toolName in EnumEx.getValues(ToolType)) {
      var item:ToolbarItem = new ToolbarItem();
      item.set('name', ToolType[toolName]);

      this.add(item);
    }
  }
}

class ToolbarItem extends Backbone.Model {

}

class ToolbarItemView extends MagicView<ToolbarItem> {
  template:Template = F.loadTemplate('tool');
  dialog:DialogWidget;

  events() {return{
    'click a': 'switchTool'
  }}

  switchTool() {
    this.trigger('switch-tool', this.model);

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
    var subviews:{[key: string]: (attrs?:any) => ToolSettingsView} = {};

    for (var toolName in EnumEx.getValues(ToolType)) {
      subviews[ToolbarTypeHelpers.elName(toolName)] = (_attrs) => {
        return new (ToolbarTypeHelpers.classType(toolName));
      };
    }

    return subviews
  }

  render():Backbone.View<Backbone.Model> {
    super.render();

    for (var subviewName in this.subviewObjects) {
      (<ToolSettingsView> this.subviewObjects[subviewName]).visible = false;
    }

    return this;
  }

  public renderSelectedTool() {
    var subview:ToolSettingsView = (<ToolSettingsView> this.getSubview(ToolbarTypeHelpers.elName(this._selectedTool.get('name'))));

    subview.visible = true;
    subview.render();
  }

  set selectedTool(tool:ToolbarItem) {
    if (this._selectedTool) {
      (<ToolSettingsView> this.getSubview(ToolbarTypeHelpers.elName(this._selectedTool.get('name')))).visible = false;
    }

    this._selectedTool = tool;
    this.renderSelectedTool();
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