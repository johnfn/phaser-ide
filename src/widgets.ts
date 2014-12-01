/// <reference path="refs.d.ts" />

interface Template { (...attrs:any[]): string; }

class DialogWidget extends Backbone.View<Backbone.Model> {
  attrs:any = {};
  template:Template = F.loadTemplate('dialog-widget');
  view:Backbone.View<Backbone.Model>;

  initialize(attrs:any) {
    _.bindAll(this, 'render');

    this.attrs = attrs;
  }

  render() {
    var buttons = this.attrs.buttons;
    var self = this;

    // For the body parameter, you can either pass in a string for the body,
    // or a view that should be rendered for the body.
    if (typeof this.attrs.body === "function") {
      var view = this.attrs.body;
      this.attrs.body = "";

      this.el.innerHTML = this.template(this.attrs);

      this.view = new view({
        el: this.$(".modal-body"),
        attrs: this.attrs
      });

      this.view.render();
    } else {
      this.el.innerHTML = this.template(this.attrs);
    }

    for (var i = 0; i < buttons.length; i++) {
      var button:ButtonWidget = new ButtonWidget(buttons[i]);

      this.$(".modal-footer").append(button.render().$el);

      this.listenTo(button, 'close-modal', () => {
        (<any> self.$(".modal")).modal('hide').on('hidden.bs.modal', () => {
          self.trigger("modal-gone");
        });

        // Destroy the backdrop manually. In the case where pressing this button will
        // delete the el that contains this modal, the backdrop will stick around awkwardly, like
        // that friend you don't like at your party.
        // That's because deleting the container of the modal deletes the modal before it has a chance
        // to clean up after itself.

        $('.modal-backdrop').remove();
      });
    }

    (<any> this.$(".modal")).modal();
    return this;
  }
}

class ButtonWidget extends Backbone.View<Backbone.Model> {
  tagName:string = "button";
  className:string = "btn";
  attrs:any = {};

  initialize(attrs:any) {
    _.bindAll(this, 'click', 'render');

    attrs.type = attrs.type || "btn-default";

    this.attrs = attrs;
  }

  events() {
    return { "click": "click" };
  }

  click(e) {
    this.trigger("close-modal");

    if (this.attrs.clickCallback) {
      this.attrs.clickCallback();
    }
  }

  render() {
    this.$el.addClass(this.attrs.type);
    this.$el.text(this.attrs.title);

    return this;
  }
}