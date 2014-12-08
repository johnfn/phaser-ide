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

  static isNumber(val) {
    return /^[0-9]+$/.test(val);
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

  public inspect(m:EntityModel) {
    var properties:ToolProperties = <ToolProperties> this.getSubview('.tool-properties');

    properties.setModel(m);
  }
}

class SpriteCanvas extends Phaser.Group {
  constructor() {
    super(G.game);
  }
}

interface ModelProperty {
  name:string;
  type:string;
}

class EntityModel extends Backbone.Model {
  static layout():ModelProperty[][] {
    return [[
      { name: 'Location', type: 'heading' }
    ],[
      { name: 'width', type: 'int' },
      { name: 'height', type: 'int' }
    ],[
      { name: 'x', type: 'int' },
      { name: 'y', type: 'int' }
    ],[
      { name: 'Content', type: 'heading' }
    ],[
      { name: 'url', type: 'string' }
    ]];
  }

  static props():ModelProperty[] {
    var layout:ModelProperty[][] = EntityModel.layout();
    var result:ModelProperty[] = [];

    for (var i = 0; i < layout.length; i++) {
      var inner:ModelProperty[] = layout[i];

      if (inner.length === 1 && inner[0].type === 'heading') continue;

      for (var j = 0; j < layout[i].length; j++) {
        result.push(layout[i][j]);
      }
    }

    return result;
  }

  constructor() {
    super();

    this.width = 32;
    this.height = 32;

    this.x = 0;
    this.y = 0;

    this.url = "<no url>";
  }


  validate(attrs, options) {
    if (!F.isNumber(attrs.width)) return "width must be a number.";
    if (!F.isNumber(attrs.height)) return "height must be a number.";
    if (!F.isNumber(attrs.x)) return "x must be a number.";
    if (!F.isNumber(attrs.y)) return "y must be a number.";

    if (attrs.width < 0) return "width must be greater than 0."
    if (attrs.height < 0) return "height must be greater than 0."
  }

  set width(val:number) { this.set('width', val); }
  get width():number { return this.get('width'); }

  set height(val:number) { this.set('height', val); }
  get height():number { return this.get('height'); }

  set x(val:number) { this.set('x', val); }
  get x():number { return this.get('x'); }

  set y(val:number) { this.set('y', val); }
  get y():number { return this.get('y'); }

  set url(val:string) { this.set('url', val); }
  get url():string { return this.get('url'); }
}

class Entity extends Phaser.Sprite {
  model:EntityModel;
  selectionBox:Phaser.Graphics;

  constructor(x:number, y:number) {
    super(G.game, x, y, "default");

    G.state.spriteCanvas.add(this);

    this.selectionBox = G.game.add.graphics(this.x, this.y);

    this.drawSelectionBox();
    this.selectionBox.visible = false;

    this.setupModel();
  }

  setupModel() {
    this.model = new EntityModel();

    this.model.on('change:width', (model:EntityModel) => this.width = model.get('width'));

    this.model.on('change:height', (model:EntityModel) => this.height = model.get('height'));
  }

  drawSelectionBox() {
    this.selectionBox.lineStyle(1, 0x000, 1);
    this.selectionBox.drawRect(-2, -2, this.width + 4, this.height + 4);
  }

  getModel():EntityModel {
    return this.model;
  }

  // graphically indicate if this entity has been selected or not
  public select(on:boolean) {
    this.selectionBox.visible = on;
  }
}

class MainState extends Phaser.State {
  public spriteCanvas:SpriteCanvas;
  public entities:Entity[] = [];

  previouslySelectedEntity:Entity;

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

  elemUnderMouse():Entity {
    var mx:number = G.game.input.x;
    var my:number = G.game.input.y;

    for (var i = 0; i < this.entities.length; i++) {
      var ent:Entity = this.entities[i];

      if ( ent.x <= mx && ent.x + ent.width >= mx &&
           ent.y <= my && ent.y + ent.height >= my) {
        return ent;
      }
    }

    return null;
  }

  public mouseDown() {
    var tool:ToolbarItem = G.ide.selectedTool();

    switch (ToolType[tool.name]) {
      case ToolType.Inspector:
        // grab it's model
        // send it to the inspector view

        var ent:Entity = this.elemUnderMouse();

        if (ent !== null) {
          ent.select(true);
        }

        G.ide.inspect(ent ? ent.getModel() : null);

        if (this.previouslySelectedEntity) {
          this.previouslySelectedEntity.select(false);
        }
        this.previouslySelectedEntity = ent;

        break;
      case ToolType.AddItem:
        var e:Entity = new Entity(G.game.input.x, G.game.input.y);

        this.entities.push(e);
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
