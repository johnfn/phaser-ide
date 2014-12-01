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

  static toolbarItems():ToolbarItemCollection {
    var items:string[] = Editor.toolbarNames;
    var itemColl:ToolbarItemCollection = new ToolbarItemCollection();

    for (var i = 0; i < items.length; i++) {
      var item:ToolbarItem = new ToolbarItem();
      item.set('name', items[i]);

      itemColl.add(item);
    }

    return itemColl;
  }
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

  // pull this out so we could override it in a superclass
  renderEl():void {
    this.el.innerHTML = this.template(this.model ? this.model.toJSON() : {});
  }

  render():Backbone.View<T> {
    this.renderEl();

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

class ToolbarItemCollection extends Backbone.Collection<ToolbarItem> {

}

class ToolbarItem extends Backbone.Model {

}

class ToolbarItemView extends MagicView<ToolbarItem> {
  template:Template = F.loadTemplate('tool');
}

class MagicListView<T extends Backbone.Model> extends MagicView<T> {
  collection:Backbone.Collection<T>;
  subview(): typeof Backbone.View { throw "need to implement subview for MagicListView!"; return undefined; }

  renderEl():void {
    this.el.innerHTML = this.template();

    this.collection.each((m:T) => {
      var subviewType:typeof Backbone.View = this.subview();
      var subview:Backbone.View<T> = new subviewType({ model: m });

      subview.setElement($("<div>").appendTo(this.$(".list-container")));
      subview.render();
    });
  }
}

class PhaserIDE extends MagicView<Backbone.Model> {
  template:Template = F.loadTemplate('editor');

  subviews:SubviewList = {
    '.toolbar': (attrs) => { return new Toolbar(F.merge(attrs, { 'collection': Editor.toolbarItems() })); }
  };
}

class Toolbar extends MagicListView<Backbone.Model> {
  template:Template = F.loadTemplate('toolbar');
  subview(): typeof Backbone.View { return ToolbarItemView; }
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
