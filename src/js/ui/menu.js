var util2 = require('util2');
var myutil = require('myutil');
var Emitter = require('emitter');
var WindowStack = require('ui/windowstack');
var Window = require('ui/window');
var simply = require('ui/simply');

var Menu = function(menuDef) {
  Window.call(this, menuDef);
  this._dynamic = false;
  this._sections = {};
};

Menu._codeName = 'menu';

util2.inherit(Menu, Window);

util2.copy(Emitter.prototype, Menu.prototype);

Menu.prototype._show = function() {
  this._resolveMenu();
  Window.prototype._show.apply(this, arguments);
};

Menu.prototype._prop = function() {
  if (this === WindowStack.top()) {
    simply.impl.menu.apply(this, arguments);
  }
};

Menu.prototype.action = function() {
  throw new Error("Menus don't support action bars.");
};

Menu.prototype._buttonInit = function() {};

Menu.prototype.buttonConfig = function() {
  throw new Error("Menus don't support changing button configurations.");
};

Menu.prototype._buttonAutoConfig = function() {};

var getMetaSection = function(sectionIndex) {
  return (this._sections[sectionIndex] || ( this._sections[sectionIndex] = {} ));
};

var getSections = function() {
  var sections = this.state.sections;
  if (sections instanceof Array) {
    return sections;
  }
  if (typeof sections === 'number') {
    sections = new Array(sections);
    return (this.state.sections = sections);
  }
  if (typeof sections === 'function') {
    this.sectionsProvider = this.state.sections;
    delete this.state.sections;
  }
  if (this.sectionsProvider) {
    sections = this.sectionsProvider.call(this);
    if (sections) {
      this.state.sections = sections;
      return getSections.call(this);
    }
  }
  return (this.state.sections = []);
};

var getSection = function(e, create) {
  var sections = getSections.call(this);
  var section = sections[e.section];
  if (section) {
    return section;
  }
  if (this.sectionProvider) {
    section = this.sectionProvider.call(this, e);
    if (section) {
      return (sections[e.section] = section);
    }
  }
  if (!create) { return; }
  return (sections[e.section] = {});
};

var getItems = function(e, create) {
  var section = getSection.call(this, e, create);
  if (!section) {
    if (e.section > 0) { return; }
    section = this.state.sections[0] = {};
  }
  if (section.items instanceof Array) {
    return section.items;
  }
  if (typeof section.items === 'number') {
    return (section.items = new Array(section.items));
  }
  if (typeof section.items === 'function') {
    this._sections[e.section] = section.items;
    delete section.items;
  }
  var itemsProvider = getMetaSection.call(this, e.section).items || this.itemsProvider;
  if (itemsProvider) {
    var items = itemsProvider.call(this, e);
    if (items) {
      section.items = items;
      return getItems.call(this, e, create);
    }
  }
  return (section.items = []);
};

var getItem = function(e, create) {
  var items = getItems.call(this, e, create);
  var item = items[e.item];
  if (item) {
    return item;
  }
  var itemProvider = getMetaSection.call(this, e.section).item || this.itemProvider;
  if (itemProvider) {
    item = itemProvider.call(this, e);
    if (item) {
      return (items[e.item] = item);
    }
  }
  if (!create) { return; }
  return (items[e.item] = {});
};

Menu.prototype._resolveMenu = function() {
  var sections = getSections.call(this);
  if (this === WindowStack.top()) {
    simply.impl.menu.call(this, this.state);
  }
};

Menu.prototype._resolveSection = function(e, clear) {
  var section = getSection.call(this, e);
  if (!section) { return; }
  section.items = getItems.call(this, e);
  if (this === WindowStack.top()) {
    simply.impl.menuSection.call(this, e.section, section, clear);
  }
};

Menu.prototype._resolveItem = function(e) {
  var item = getItem.call(this, e);
  if (!item) { return; }
  if (this === WindowStack.top()) {
    simply.impl.menuItem.call(this, e.section, e.item, item);
  }
};

Menu.prototype._emitSelect = function(e) {
  var item = getItem.call(this, e);
  if (!item) { return; }
  switch (e.type) {
    case 'select':
      if (typeof item.select === 'function') {
        if (item.select(e) === false) {
          return false;
        }
      }
      break;
    case 'longSelect':
      if (typeof item.longSelect === 'function') {
        if (item.longSelect(e) === false) {
          return false;
        }
      }
      break;
  }
};

Menu.prototype.sections = function(sections) {
  if (typeof sections === 'function') {
    delete this.state.sections;
    this.sectionsProvider = sections;
    this._resolveMenu();
    return this;
  }
  this.state.sections = sections;
  this._resolveMenu();
  return this;
};

Menu.prototype.section = function(sectionIndex, section) {
  if (typeof sectionIndex === 'object') {
    sectionIndex = sectionIndex.section || 0;
  } else if (typeof sectionIndex === 'function') {
    this.sectionProvider = sectionIndex;
    return this;
  }
  var menuIndex = { section: sectionIndex };
  if (!section) {
    return getSection.call(this, menuIndex);
  }
  var sections = getSections.call(this);
  var prevLength = sections.length;
  sections[sectionIndex] = util2.copy(section, sections[sectionIndex]);
  if (sections.length !== prevLength) {
    this._resolveMenu();
  }
  this._resolveSection(menuIndex, typeof section.items !== 'undefined');
  return this;
};

Menu.prototype.items = function(sectionIndex, items) {
  if (typeof sectionIndex === 'object') {
    sectionIndex = sectionIndex.section || 0;
  } else if (typeof sectionIndex === 'function') {
    this.itemsProvider = sectionIndex;
    return this;
  }
  if (typeof items === 'function') {
    getMetaSection.call(this, sectionIndex).items = items;
    return this;
  }
  var menuIndex = { section: sectionIndex };
  if (!items) {
    return getItems.call(this, menuIndex);
  }
  var section = getSection.call(this, menuIndex, true);
  section.items = items;
  this._resolveSection(menuIndex, true);
  return this;
};

Menu.prototype.item = function(sectionIndex, itemIndex, item) {
  if (typeof sectionIndex === 'object') {
    item = itemIndex || item;
    itemIndex = sectionIndex.item;
    sectionIndex = sectionIndex.section || 0;
  } else if (typeof sectionIndex === 'function') {
    this.itemProvider = sectionIndex;
    return this;
  }
  if (typeof itemIndex === 'function') {
    item = itemIndex;
    itemIndex = null;
  }
  if (typeof item === 'function') {
    getMetaSection.call(this, sectionIndex).item = item;
    return this;
  }
  var menuIndex = { section: sectionIndex, item: itemIndex };
  if (!item) {
    return getItem.call(this, menuIndex);
  }
  var items = getItems.call(this, menuIndex, true);
  var prevLength = items.length;
  items[itemIndex] = util2.copy(item, items[itemIndex]);
  if (items.length !== prevLength) {
    this._resolveSection(menuIndex);
  }
  this._resolveItem(menuIndex);
  return this;
};

Menu.emit = function(type, subtype, e) {
  Window.emit(type, subtype, e, Menu);
};

Menu.emitSection = function(section) {
  var menu = WindowStack.top();
  if (!(menu instanceof Menu)) { return; }
  var e = {
    section: section
  };
  if (Menu.emit('section', null, e) === false) {
    return false;
  }
  menu._resolveSection(e);
};

Menu.emitItem = function(section, item) {
  var menu = WindowStack.top();
  if (!(menu instanceof Menu)) { return; }
  var e = {
    section: section,
    item: item,
  };
  if (Menu.emit('item', null, e) === false) {
    return false;
  }
  menu._resolveItem(e);
};

Menu.emitSelect = function(type, section, item) {
  var menu = WindowStack.top();
  if (!(menu instanceof Menu)) { return; }
  var e = {
    section: section,
    item: item,
  };
  switch (type) {
    case 'menuSelect': type = 'select'; break;
    case 'menuLongSelect': type = 'longSelect'; break;
  }
  if (Menu.emit(type, null, e) === false) {
    return false;
  }
  menu._emitSelect(e);
};

module.exports = Menu;
