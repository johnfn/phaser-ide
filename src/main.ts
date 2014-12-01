/// <reference path="refs.d.ts" />

// globals
class G {
  static SCREEN_WIDTH:number = 500;
  static SCREEN_HEIGHT:number = 500;

  static MAP_W:number = 500;
  static MAP_H:number = 500;

  static game:Phaser.Game;
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
}

interface ViewMaker { (attrs:any):MagicView<Backbone.Model> };
interface SubviewList {[key: string]: (attrs?:any) => MagicView<Backbone.Model> };

class MagicView<T extends Backbone.Model> extends Backbone.View<T> {
  template:Template = function(...attrs:any[]) { throw "no template! :X"; return ""; };
  subviews:SubviewList = {};
  attrs:any;

  initialize(attrs:any) {
    _.bindAll(this, 'render');

    this.attrs = attrs;
    this.subviews = attrs.subviews || {};
  }

  render():Backbone.View<T> {
    this.el.innerHTML = this.template();

    for (var el in this.subviews) {
      var viewMaker:ViewMaker = this.subviews[el];
      var view:Backbone.View<Backbone.Model> = viewMaker({
        el: this.$(el)
      });

      view.render();
    }

    return this;
  }
}

class PhaserIDE extends MagicView<Backbone.Model> {
  template:Template = F.loadTemplate('editor');

  subviews:SubviewList = {
    '.toolbar': (attrs) => { return new Toolbar(attrs); }
  };
}

class Toolbar extends MagicView<Backbone.Model> {
  template:Template = F.loadTemplate('toolbar');
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
