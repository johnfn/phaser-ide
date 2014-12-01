/// <reference path="refs.d.ts" />


interface ViewMaker { (attrs:any):MagicView<Backbone.Model> };
interface SubviewList {[key: string]: (attrs?:any) => MagicView<Backbone.Model> };

class MagicView<T extends Backbone.Model> extends Backbone.View<T> {
  template:Template = function(...attrs:any[]) { throw "no template! :X"; return ""; };
  subviews:SubviewList = {};
  subviewObjects:{[key: string]: MagicView<Backbone.Model>} = {};
  attrs:any;
  parent:MagicView<Backbone.Model>;

  initialize(attrs:any) {
    this.bindEverything();

    this.attrs = attrs;
    this.parent = attrs.parent || null;
    this.subviews = attrs.subviews || {};
  }

  private bindEverything() {
    var args = [this, 'trigger', 'renderEl', 'render'];

    for (var prop in this) {
      if (_.isFunction(this[prop]) && !(prop in Backbone.View.prototype)) {
        args.push(prop);
      }
    }

    _.bindAll.apply(this, args);
  }

  getSubview(el:string):MagicView<Backbone.Model> {
    if (!(el in this.subviewObjects)) {
      throw "no el named " + el + " in this MagicView's subviews.";
    }

    return this.subviewObjects[el];
  }

  // propagate events upward to parent MagicViews
  trigger(eventName:string, ...args:any[]): any {
    var args:any[] = [eventName].concat(args);
    var result:any = super.trigger.apply(this, args);

    if (this.parent && result !== false) {
      this.parent.trigger.apply(this, args);
    }
  }

  // pull this out so we could override it in a superclass
  renderEl():void {
    this.el.innerHTML = this.template(this.model ? this.model.toJSON() : {});
  }

  render():Backbone.View<T> {
    this.renderEl();

    for (var el in this.subviews) {
      var viewMaker:ViewMaker = this.subviews[el];
      var $el:JQuery = this.$(el);

      if (!$el) {
        throw "no el with the name " + el + " found. :(";
      }

      var view:MagicView<Backbone.Model> = viewMaker({
        el: $el,
        parent: this
      });

      view.render();
      this.subviewObjects[el] = view;
    }

    return this;
  }
}

class MagicListView<T extends Backbone.Model> extends MagicView<T> {
  collection:Backbone.Collection<T>;
  subview(): typeof MagicView { throw "need to implement subview for MagicListView!"; return undefined; }

  renderEl():void {
    this.el.innerHTML = this.template();

    this.collection.each((m:T) => {
      var subviewType:typeof Backbone.View = this.subview();
      var subview:Backbone.View<T> = new subviewType({ model: m, parent: this });

      subview.setElement($("<div>").appendTo(this.$(".list-container")));
      subview.render();
    });
  }
}