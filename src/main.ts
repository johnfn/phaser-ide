/// <reference path="refs.d.ts" />

// globals
class G {
  static SCREEN_WIDTH:number = 500;
  static SCREEN_HEIGHT:number = 500;

  static MAP_W:number = 500;
  static MAP_H:number = 500;

  static game:Phaser.Game;
  static state:MainState;
  static ide:PhaserIDE;
}

// more globals
class Editor {
  static toolbarNames:string[] = ['Inspector', 'Add Item'];
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

class PhaserIDE extends MagicView<Backbone.Model> {
  template:Template = F.loadTemplate('editor');

  subviews():SubviewList {
    return {
      '.toolbar': (_attrs) => { return new Toolbar(F.merge(_attrs, { collection: new ToolbarItemCollection() })); },
      '.tool-properties': (_attrs) => { return new ToolProperties(_attrs); }
    };
  }

  constructor(attrs:any) {
    super(attrs);

    this.listenTo(this, 'switch-tool', (m:ToolbarItem) => {
      var toolbar:Toolbar = <Toolbar> this.getSubview('.toolbar');
      toolbar.selectedTool = m;

      var properties:ToolProperties = <ToolProperties> this.getSubview('.tool-properties');
      properties.selectedTool = m;
    });
  }

  selectedTool():ToolbarItem {
    var toolbar:Toolbar = <Toolbar> this.getSubview('.toolbar');

    return toolbar.selectedTool;
  }
}

class SpriteCanvas extends Phaser.Group {
  constructor() {
    super(G.game);
  }
}

class EntityModel extends Backbone.Model {

}

class Entity extends Phaser.Sprite {
  model:EntityModel;

  constructor(x:number, y:number) {
    super(G.game, x, y, "default");

    G.state.spriteCanvas.add(this);

    this.model = new EntityModel();
  }
}

class MainState extends Phaser.State {
  public spriteCanvas:SpriteCanvas;

  public preload():void {
    // fw, fh, num frames,
    this.load.spritesheet("default", "assets/default.png", 32, 32);
  }

  public init():void {
    G.game.stage.backgroundColor = "#356b92";
  }

  public create():void {
    G.game.world.setBounds(0, 0, G.MAP_W, G.MAP_H);

    this.spriteCanvas = new SpriteCanvas();
    G.game.add.existing(this.spriteCanvas);

    G.game.input.onDown.add(this.mouseDown, this);
  }

  public mouseDown() {
    var tool:ToolbarItem = G.ide.selectedTool();

    switch (tool.get('name')) {
      case 'Inspector':
        console.log('inspector');
        // figure out what entity you clicked on
        // grab it's model
        // send it to the inspector view
        break;
      case 'Add Item':
        var e:Entity = new Entity(G.game.input.x, G.game.input.y);

        break
      default:
        throw "unsupported tool";
        break;
    }
  }
}

$(function() {
  G.ide = new PhaserIDE({ el: $("#main-content") });
  G.ide.render();

  G.state = new MainState();
  G.game = new Phaser.Game(G.SCREEN_WIDTH, G.SCREEN_HEIGHT, Phaser.WEBGL, "main", G.state);
});
