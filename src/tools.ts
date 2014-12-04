/// <reference path="refs.d.ts" />

enum ToolType { Inspector, AddItem };

class ToolbarTypeHelpers {
  static toolToString(tool:ToolType):string {
    return ToolType[tool];
  }
  static toolTemplate(tool:ToolType):string {
    return ToolbarTypeHelpers.toolToString(tool).toLowerCase().replace(/ /g, "-");
  }

  static elPropertiesName(tool:ToolType):string {
    return "." + ToolbarTypeHelpers.toolTemplate(tool) + "-properties";
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

    EnumEx.loopValues(ToolType, (toolName) => {
      var item:ToolbarItem = new ToolbarItem();
      item.set('name', ToolType[toolName]);

      this.add(item);
    });
  }
}

class ToolbarItem extends Backbone.Model {
  set name(val:string) {
    this.set('name', val);
  }

  get name():string {
    return this.get('name');
  }
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

  events() {return{
    'keydown .property-dynamic': 'updateProperty'
  }}

  updateProperty(e:Event) {
    var $el:JQuery = $(e.currentTarget);

    this.model.validationError = "";
    this.model.set($el.data('prop'), $el.val(), { validate: true });

    $el.css('color', this.model.validationError === "" ? 'black' : 'red');
  }
}

class InspectorProperties extends ToolSettingsView {
  template:Template = F.loadTemplate('inspector-properties');

  subviews():SubviewList {
    var subviews:{[key: string]: (attrs?:any) => MagicView<Backbone.Model>} = {};

    if (!this.model) return subviews;

    // TODO - use layout and handle groups properly.
    var props:ModelProperty[] = EntityModel.props();

    for (var i = 0; i < props.length; i++) {
      subviews['.' + i] = (_attrs) => {
        return new FormItem(F.merge(F.merge(_attrs, {model: this.model}), {
          propName: props[i].name
        }));
      }
    }
  }

  renderEl() {
    super.renderEl();

    // add containers for every subview
    for (var elClassName in this.subviews()) {
      this.$('.property-container').append($('<div>', { 'class': elClassName }));
    }
  }
}

class AddItemProperties extends ToolSettingsView {
  template:Template = F.loadTemplate('add-item-properties');
}

class ToolProperties extends MagicView<Backbone.Model> {
  template:Template = F.loadTemplate('tool-properties');
  _selectedTool:ToolbarItem;

  subviews():SubviewList {
    var subviews:{[key: string]: (attrs?:any) => ToolSettingsView} = {};

    // TODO: there's no need for me to have to hardcode the class names. just
    // generate them programmatically.

    // add each tool as a subview.

    EnumEx.loopValues(ToolType, (toolName) => {
      subviews[ToolbarTypeHelpers.elPropertiesName(toolName)] = (_attrs) => {
        var type = ToolbarTypeHelpers.classType(toolName);

        return new type(_attrs);
      };
    });

    return subviews
  }

  render():Backbone.View<Backbone.Model> {
    super.render();

    for (var subviewName in this.subviewObjects) {
      (<ToolSettingsView> this.subviewObjects[subviewName]).visible = false;
    }

    return this;
  }

  getActiveSubview():ToolSettingsView {
    var type:number = ToolType[this._selectedTool.name];
    var subview:ToolSettingsView = (<ToolSettingsView> this.getSubview(ToolbarTypeHelpers.elPropertiesName(type)));

    return subview;
  }

  public renderSelectedTool() {
    var subview:ToolSettingsView = this.getActiveSubview();

    subview.visible = true;
    subview.render();
  }

  public setModel(m:EntityModel) {
    this.getActiveSubview().model = m;

    this.renderSelectedTool();
  }

  set selectedTool(tool:ToolbarItem) {
    if (this._selectedTool) {
      var type:number = ToolType[this._selectedTool.name];

      (<ToolSettingsView> this.getSubview(ToolbarTypeHelpers.elPropertiesName(type))).visible = false;
    }

    this._selectedTool = tool;
    this.renderSelectedTool();
  }
}

class SelectedToolView extends MagicView<ToolbarItem> {
  template:Template = F.loadTemplate('selected-tool')
}

class Toolbar extends MagicListView<ToolbarItem> {
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
