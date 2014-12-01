/// <reference path="refs.d.ts" />


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