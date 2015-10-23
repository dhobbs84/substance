'use strict';

var oo = require('../../util/oo');
var Component = require('../../ui/Component');
var TextProperty = require('../../ui/TextPropertyComponent');
var $$ = Component.$$;

function FigureComponent() {
  Component.apply(this, arguments);
}

FigureComponent.Prototype = function() {

  this.render = function() {
    var componentRegistry = this.context.componentRegistry;
    var contentNode = this.props.node.getContentNode();
    var ContentComponentClass = componentRegistry.get(contentNode.type);
    var el = $$('div')
      .addClass("content-node figure clearfix "+this.props.node.type)
      .attr("data-id", this.props.node.id);

    el.append($$('div')
      .addClass('label').attr("contenteditable", false)
      .append(this.props.node.label)
    );
    el.append(
      $$(TextProperty, {
        tagName: 'div',
        doc: this.props.doc,
        path: [this.props.node.id, "title"]
      })
      .addClass('title')
    );
    el.append($$('div')
      .addClass('figure-content')
      .attr('contenteditable', false)
      .append(
        $$(ContentComponentClass, {
          doc: this.props.doc,
          node: contentNode
        })
      )
    );
    el.append($$('div')
      .addClass('description small')
      .append(
        $$(TextProperty, {
          tagName: 'div',
          doc: this.props.doc,
          path: [this.props.node.id, "caption"]
        })
        .addClass('caption')
      )
    );
    return el;
  };
};

oo.inherit(FigureComponent, Component);

module.exports = FigureComponent;