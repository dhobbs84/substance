'use strict';

var each = require('lodash/each');
var DataNode = require('./data/Node');

/**
  Base node type for document nodes.

  @class
  @abstract

  @param {model/Document} doc A document instance
  @param {object} node properties
  @example

  The following example shows how a new node type is defined.


  ```js
  function Todo() {
    Todo.super.apply(this, arguments);
  }
  TextBlock.extend(Todo);
  Todo.define({
    type: 'todo',
    content: 'text',
    done: { type: 'bool', default: false }
  });
  ```

  The following
    data types are supported:

      - `string` bare metal string data type
      - `text` a string that carries annotations
      - `number` numeric values
      - `bool` boolean values
      - 'id' a node id referencing another node in the document
*/

function DocumentNode(doc, props) {
  DataNode.call(this, props);
  // being less strict here allows us to create a detached node
  // which can be useful for testing
  // if (!doc) throw new Error('Document instance is mandatory.');
  this.document = doc;
}

DocumentNode.Prototype = function() {

  this._isDocumentNode = true;

  var _super = DocumentNode.super.prototype;

  /**
    Get the Document instance.

    @returns {Document}
  */
  this.getDocument = function() {
    return this.document;
  };

  /**
    Whether this node has a parent.

    `parent` is a built-in property for implementing nested nodes.

    @returns {Boolean}
  */
  this.hasParent = function() {
    return Boolean(this.parent);
  };

  /**
    @returns {DocumentNode} the parent node
  */
  this.getParent = function() {
    return this.document.get(this.parent);
  };

  /**
    Checks whether this node has children.

    @returns {Boolean} default: false
  */
  this.hasChildren = function() {
    return false;
  };

  /**
    Get the index of a given child.

    @returns {Number} default: -1
  */
  this.getChildIndex = function(child) { // eslint-disable-line
    return -1;
  };

  /**
    Get a child node at a given position.

    @returns {DocumentNode} default: null
  */
  this.getChildAt = function(idx) { // eslint-disable-line
    return null;
  };

  /**
    Get the number of children nodes.

    @returns {Number} default: 0
  */
  this.getChildCount = function() {
    return 0;
  };

  /**
    Get the root node.

    The root node is the last ancestor returned
    by a sequence of `getParent()` calls.

    @returns {DocumentNode}
  */
  this.getRoot = function() {
    var node = this;
    while (node.hasParent()) {
      node = node.getParent();
    }
    return node;
  };

  // TODO: should this really be here?
  // volatile property necessary to render highlighted node differently
  // TODO: We should get this out here
  this.setHighlighted = function(highlighted, scope) {
    if (this.highlighted !== highlighted) {
      this.highlightedScope = scope;
      this.highlighted = highlighted;
      this.emit('highlighted', highlighted);
    }
  };

  function _matchPropertyEvent(eventName) {
    return /([a-zA-Z_0-9]+):changed/.exec(eventName);
  }

  this.on = function(eventName, handler, ctx) {
    var match = _matchPropertyEvent(eventName);
    if (match) {
      var propertyName = match[1];
      if (this.constructor.schema[propertyName]) {
        var doc = this.getDocument();
        doc.getEventProxy('path')
          .on([this.id, propertyName], handler, ctx);
      }
    }
    _super.on.apply(this, arguments);
  };

  this.off = function(ctx, eventName, handler) {
    var doc = this.getDocument();
    var match = false;
    if (!eventName) {
      doc.getEventProxy('path').off(ctx);
    } else {
      match = _matchPropertyEvent(eventName);
    }
    if (match) {
      var propertyName = match[1];
      doc.getEventProxy('path')
        .off(ctx, [this.id, propertyName], handler);
    }
    _super.off.apply(this, arguments);
  };

  // Experimental: we are working on a simpler API replacing the
  // rather inconvenient EventProxy API.
  this.connect = function(ctx, handlers) {
    console.warn('DEPRECATED: use Node.on() instead');
    each(handlers, function(func, name) {
      this.on(name, func, ctx);
    }.bind(this));
  };

  this.disconnect = function(ctx) {
    console.warn('DEPRECATED: use Node.off() instead');
    this.off(ctx);
  };

  this._onPropertyChange = function(propertyName) {
    var args = [propertyName + ':changed']
      .concat(Array.prototype.slice.call(arguments, 1));
    this.emit.apply(this, args);
  };

  // Node categories
  // --------------------

  /**
    @returns {Boolean} true if node is a block node (e.g. Paragraph, Figure, List, Table)
  */
  this.isBlock = function() {
    return this.constructor.isBlock;
  };

  /**
    @returns {Boolean} true if node is a text node (e.g. Paragraph, Codebock)
  */
  this.isText = function() {
    return this.constructor.isText;
  };

  /**
    @returns {Boolean} true if node is an annotation node (e.g. Strong)
  */
  this.isPropertyAnnotation = function() {
    return this.constructor.isPropertyAnnotation;
  };

  /**
    @returns {Boolean} true if node is an inline node (e.g. Citation)
  */
  this.isInline = function() {
    return this.constructor.isInline;
  };

  /**
    @returns {Boolean} true if node is a container annotation (e.g. multiparagraph comment)
  */
  this.isContainerAnnotation = function() {
    return this.constructor.isContainerAnnotation;
  };

};

DataNode.extend(DocumentNode);

/**
  Declares a node to be treated as block-type node.

  BlockNodes are considers the direct descendant of `Container` nodes.
  @type {Boolean} default: false
*/
DocumentNode.isBlock = false;

/**
  Declares a node to be treated as text-ish node.

  @type {Boolean} default: false
*/
DocumentNode.isText = false;

/**
  Declares a node to be treated as {@link model/PropertyAnnotation}.

  @type {Boolean} default: false
*/
DocumentNode.isPropertyAnnotation = false;

/**
  Declares a node to be treated as {@link model/ContainerAnnotation}.

  @type {Boolean} default: false
*/
DocumentNode.isContainerAnnotation = false;

/**
  Declares a node to be treated as {@link model/InlineNode}.

  @type {Boolean} default: false
*/
DocumentNode.isInline = false;

module.exports = DocumentNode;
