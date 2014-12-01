/// <reference path="refs.d.ts" />

// globals
class G {
  static SCREEN_WIDTH:number = 500;
  static SCREEN_HEIGHT:number = 500;

  static MAP_W:number = 500;
  static MAP_H:number = 500;

  static game:Phaser.Game;
}

// more globals
class Editor {
  static toolbarNames:string[] = ['Inspect', 'Add Item'];
}

var fileCache:{[key: string]: string} = {};

// global functions
class F {
  static loadTemplate(file:string):(...atrs:any[]) => string {
    if (!(file in fileCache)) {
      fileCache[file] = $.ajax({
        url: "templates/" + file + ".html",
        async: false
      }).responseText;
    }

    return _.template(fileCache[file]);
  }

  // merge 2 objects together, returning the result.
  // no more overwriting objects any more, that was annoying.
  static merge(o1:any, o2:any) {
    var result:any = {};

    for (var key in o1) result[key] = o1[key];
    for (var key in o2) result[key] = o2[key];

    return result;
  }
}

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

class PhaserIDE extends MagicView<Backbone.Model> {
  template:Template = F.loadTemplate('editor');

  subviews:SubviewList = {
    '.toolbar': (_attrs) => { return new Toolbar(F.merge(_attrs, { collection: new ToolbarItemCollection() })); }
  };

  constructor(attrs:any) {
    super(attrs);

    this.listenTo(this, 'switch-tool', (m:ToolbarItem) => {
      var toolbar:Toolbar = <Toolbar> this.getSubview('.toolbar');
      toolbar.selectedTool = m;
    });
  }
}

class SelectedToolView extends MagicView<ToolbarItem> {
  template:Template = F.loadTemplate('selected-tool')
}

class Toolbar extends MagicListView<Backbone.Model> {
  private _selectedTool:ToolbarItem;

  template:Template = F.loadTemplate('toolbar');
  subview(): typeof MagicView { return ToolbarItemView; }
  subviews:SubviewList = {
    '.selected-tool': (_attrs) => { return new SelectedToolView(F.merge(_attrs, { model: this._selectedTool })); }
  };

  constructor(attrs:any) {
    super(attrs);

    this._selectedTool = this.collection.first();
  }

  set selectedTool(val:ToolbarItem) {
    this._selectedTool = val;

    this.render();
  }
}

class MainState extends Phaser.State {
  public preload():void {
    // fw, fh, num frames,
    this.load.spritesheet("default", "assets/default.png", 32, 32);
  }

  public init():void {
    G.game.stage.backgroundColor = "#356b92";
  }

  public create():void {
    G.game.world.setBounds(0, 0, G.MAP_W, G.MAP_H);

    G.game.add.sprite(25, 25, "default");
  }
}

class Game {
  state: Phaser.State;

  constructor() {
    this.state = new MainState();
    G.game = new Phaser.Game(G.SCREEN_WIDTH, G.SCREEN_HEIGHT, Phaser.WEBGL, "main", this.state);
  }
}

$(function() {
  var ide:PhaserIDE = new PhaserIDE({ el: $("#main-content") });
  ide.render();

  new Game();
});
