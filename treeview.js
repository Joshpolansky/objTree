/*
 * @author Josh Polansky
 */

var ATREEVIEW = function (options) {

    'use strict';

    // Grab machine scope for lower functions
    var project, defaults, settings, ProjectName;
    var tree = this;
    var treeview;
    var context;
    var contextName;
    var nodeNames = [];
    tree.readOnly = false;

    var ColumnName = ["Name", "Value"];


    // Set defaults and extend with options, without modifying defaults
    defaults = {
        someSetting: 0,
    };

    settings = ATREEVIEW.prototype.extend({}, defaults, options);

    tree.setColumnNames = function (names) {
        ColumnName = names;
        var divs = treeview.find(".treeview-col-name");
        if (divs.length) {
            divs[0].textContent = ColumnName[1];
            divs[1].textContent = ColumnName[0];
        }
        return tree;
    }

    tree.refreshView = function () {
        if (tree.isEmptyObject(context) || tree.isEmptyObject(treeview)) {
            return;
        }
        treeview.empty();

        var Root = generateRoot(contextName);
        Root.find('.treeview-content').on("click", function (e) {
            if (!e.shiftKey) {
                toggleColapse($(this));
            }
        })
        treeview.append(Root);


        var valueContainer = Root.find('.treeview-container');

        if(nodeNames.length==0){
            buildNode(context,valueContainer,contextName);
        }

        nodeNames.forEach(function (element) {
            valueContainer.append(addNode(element));

        }, this);
    }

    tree.newNode = function (nodeName) {
        nodeNames.push(nodeName);
        tree.refreshView();
        return tree;
    }

    tree.setContext = function (data, initData) {

        contextName = data;
        context = getDeepValue(window, data);
        if(typeof initData == 'undefined' || initData)
        {
            tree.refreshView();
        }
        return tree;
    }


    var callbacks = [];
    tree.on = function(callback){
        callbacks.push(callback);
    }
    function executeCallback(eventName){
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        callbacks.forEach(function(userCallbacks){
            Object.keys(userCallbacks).forEach(function(callBack){
                if(callBack == eventName){
                    userCallbacks[callBack].apply(this,args);
                }
            })
        })
    }

    function addNode(nodeName) {
        var node = generateNode(nodeName);
        buildNode(context[nodeName], node, nodeName);
        return node;
    }
    function buildNode(nodeContext, nodeRoot, nodeName) {

        buildHeirarchicalTree(nodeContext, nodeRoot, function (key, final, parentObject, path) {
            if (final == 1) {
                return generateSimple(key, parentObject, path);
            }
            else {
                var label = path;
                if (!isNaN(key)) {
                    label += "[" + key + "]";
                }
                else {
                    label += "." + key;
                }
                return generateNode(label.split(".").pop());
            }
        }, context, null, nodeName);

        nodeRoot.find('.treeview-content, .treeview-value').on("click", function (e) {
            //if we should select multiples
            if (!e.shiftKey) {
                treeview.find(".treeview-selected").removeClass("treeview-selected");
            }

            setActive($(this));
            toggleSelected($(this));
        })

        nodeRoot.find('.treeview-content').on("click", function (e) {
            if (!e.shiftKey) {
                toggleColapse($(this));
            }
        })

        nodeRoot.find('.treeview-value').parent('.treeview-node').addClass('treeview-simple').removeClass('treeview-node');
        nodeRoot.find('.treeview-content').removeClass('treeview-node');

    }

    function buildHeirarchicalTree(object, node, callback, parentObject, previouskey, path) {
        var type = typeof object;
        if ('string' == type || type == 'undefined' || Object.keys(object).length == 0 ) {
            if (callback != null) {
                return callback(previouskey, 1, parentObject, path);
            }
        }
        else {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    if (typeof object[key] != 'function') {
                        var newPath = path;
                        var thisnode = callback(key, 0, parentObject, path);
                        if (!isNaN(key)) {
                            newPath += "[" + key + "]";
                        }
                        else {
                            newPath += "." + key;
                        }
                        var simpleNode = buildHeirarchicalTree(object[key], thisnode, callback, object, key, newPath);

                        thisnode.prepend(simpleNode);
                        node.append(thisnode);
                        // try{
                        //     simpleNode.data()
                        // }catch(e){
                        //     console.log(e);
                        // }
                        if(simpleNode){
                            executeCallback('newNode',simpleNode, simpleNode.data())
                        }
                    }
                }
            }
        }
    }
    function generateRoot(RootName) {
        return $('<div class="treeview">'
                    + '<div class="treeview-title">'
                        + '<div class="treeview-col-name treeview-value">'+ ColumnName[1] + '</div>'
                        + '<div class="treeview-col-name">'+ ColumnName[0] +'</div>'
                    +'</div>'
                    +'<div class="treeview-container">'
                        +'<div class="treeview-content treeview-root-node">' + RootName + '</div>'
                    +'</div>'
                +'</div>');
    }
    function generateSimple(simple, parentObject, path) {

        var nodeLabel = parentObject[simple];

        var $node = $("<div class=\"treeview-value\">" + nodeLabel + "</div>");
        var treeData = {};
        treeData.parentObject = parentObject;
        treeData.parentObjectProperty = simple;
        treeData.path = path;
        $node.data(treeData);
        var myData = $node.data();
        return $node;
    }
    function generateNode(node) {
        return $("<div class=\"treeview-node\"><div class=\"treeview-node treeview-content\">" + node + "</div></div>");
    }
    function setSelected(selected) {
        treeview.find(".treeview-selected").removeClass("treeview-selected");
        return select(selected);
    }
    function select(selected) {
        if (!tree.isEmptyObject(selected)) {
            selected.addClass("treeview-selected");
            selected.siblings(".treeview-content, .treeview-value").addClass("treeview-selected");
        }
        return selected;
    }
    function deselect(selected) {
        if (!tree.isEmptyObject(selected)) {
            selected.removeClass("treeview-selected");
            selected.siblings(".treeview-content, .treeview-value").removeClass("treeview-selected");
        }
        return selected;
    }
    function deselectAll() {
        var selectedObjects = treeview.find(".treeview-value.treeview-selected");
        selectedObjects.each(function () {
            $(this).removeClass("treeview-editing");
        });
        setActive();
        setSelected();
    }
    function toggleSelected(selected) {
        //Toggle selected
        selected.toggleClass("treeview-selected");
        selected.siblings(".treeview-content, .treeview-value").toggleClass("treeview-selected");
        return selected;
    }
    function setActive(active) {
        //We can only have one active so remove active from everyone
        treeview.find(".treeview-active,.treeview-active-node").removeClass("treeview-active treeview-active-node");
        if (!tree.isEmptyObject(active)) {
            //Set on this one
            active.addClass("treeview-active");
            active.parent().addClass("treeview-active-node");
            active.siblings(".treeview-content, .treeview-value").addClass("treeview-active");
            var scroller = treeview.find('.treeview-container');
            var scroll = scroller.scrollTop();
            var position = active.position().top;
            if(position < 20){
               scroller.scrollTop(scroll + position - 20);
            }
            else if(position > scroller.height() - 20){
               scroller.scrollTop(scroll + position - scroller.height() + 20);
            }
        }
        return active;
    }
    function toggleColapse(colapse) {
        if (!colapse.parent().hasClass("treeview-simple")) {
            colapse.toggleClass("treeview-colapse-sibling");
            colapse.parent().toggleClass("treeview-colapse-children");
        }
        return colapse;
    }
    function setColapse(colapse) {
        if (!colapse.hasClass("treeview-simple") && !colapse.parent().hasClass("treeview-simple") && !colapse.hasClass("treeview-colapse-sibling")) {
            colapse.addClass("treeview-colapse-sibling");
            colapse.parent().addClass("treeview-colapse-children");
        }
        else {
            if (!colapse.hasClass('treeview-root-node')) {
                var colapsable = colapse.parent().parent().children().not('.treeview-title').first();
                setColapse(colapsable);
                setActive(colapsable);
            }
        }

        return colapse;
    }
    function removeColapse(colapse) {
        if (!colapse.parent().hasClass("treeview-simple")) {
            colapse.removeClass("treeview-colapse-sibling");
            colapse.parent().removeClass("treeview-colapse-children");
        }
        return colapse;
    }
    function getActiveNode() {
        var $activeObject = treeview.find(".treeview-active-node");
        return $activeObject;
    }
    function getActive() {
        var $activeObject = treeview.find(".treeview-active").not(".treeview-value");
        return $activeObject;
    }
    function getNextShowing() {
        var $activeObject = treeview.find(".treeview-active-node");
        if ($activeObject.length > 0) {
            //If this object is colapsed or it is simple we should just grab the next object at the same level
            if ($activeObject.hasClass("treeview-colapse-children") || $activeObject.hasClass("treeview-simple")) {
                var $nextobject = $activeObject.next();
                //If there is not a next object at this level we should search up the tree
                if ($nextobject.length == 0) {
                    return getNextParent($activeObject);
                }
                //from what we found, return something that is selectables
                return getSelectable($nextobject);
            }
            //If this object is a node and it isn't colapsed lets get the first child
            else {
                $activeObject = treeview.find(".treeview-active");
                return getSelectable($activeObject.next());
            }
        }
    }
    function getPreviousShowing () {
        var $activeObject = treeview.find(".treeview-active-node");
        if ($activeObject.length > 0) {
            var $previousInLevel = $activeObject.prev();
            if ($previousInLevel.length > 0) {
                if ($previousInLevel.hasClass('treeview-content')) {
                    return $previousInLevel;
                }
                else if ($previousInLevel.hasClass("treeview-node")
                && !$previousInLevel.hasClass("treeview-colapse-children")) {

                    return getLastShowingFromNode($previousInLevel);

                } else if($previousInLevel.is('.treeview-simple,.treeview-node')){
                    return getSelectable($previousInLevel);
                }
                else{
                    return null;
                }
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }

    }
    function getNextParent(activeObject) {
        if (activeObject.parent().next().length > 0) {
            var NextParent = getSelectable(activeObject.parent().next());
            return NextParent;
        }
        else {
            if (activeObject.hasClass('treeview-container')) {
                return null;
            }
            else {
                return getNextParent(activeObject.parent());
            }
        }
    }
    function getSelectable($node){
        return $node.children().first();
    }
    function getLastShowingFromNode($node) {
        var $lastNode = $node.children().last();
        if($lastNode.hasClass('treeview-colapse-children')){
            return getSelectable($lastNode);
        }
        else if($lastNode.hasClass('treeview-simple')){
            return getSelectable($lastNode);
        }
        else{
            return getLastShowingFromNode($lastNode);
        }
    }
    function buildTreeFlat(object, callback) {
        if (Object.keys(object).length == 0) {
            if (callback != null) {
                return callback(object);
            }
        }
        else {
            for (var key in object) {
                if (object.hasOwnProperty(key)) {
                    callback(key);
                    buildTreeFlat(object[key], callback);
                }
            }
        }
    }
	function getDeepValue(obj, prop) {

        var e, startArrayIndex, type, i;

        // First time through, split prop
        if (typeof prop === "string") {
            prop = prop.split(".");
        }

        if (prop.length > 1) {

            // If not at bottom of prop, keep going
            e = prop.shift();

            // Check for array elements
            startArrayIndex = e.indexOf('[');
            if (startArrayIndex === -1) {
                type = Object.prototype.toString.call(obj[e]);
                if (type !== "[object Object]") {
                    return undefined;
                }
                return getDeepValue(obj[e], prop);
            } else {
                i = parseInt(e.substring(startArrayIndex + 1), 10);
                e = e.substring(0, startArrayIndex);
                type = Object.prototype.toString.call(obj[e]);
                if (type !== "[object Array]") {
                    return undefined;
                }
                type = Object.prototype.toString.call(obj[e][i]);
                if (type !== "[object Object]") {
                    return undefined;
                }
                return getDeepValue(obj[e][i], prop);
            }

        } else {

            e = prop[0];

            // Check for array elements
            startArrayIndex = e.indexOf('[');
            if (startArrayIndex === -1) {
                return obj[e];
            } else {
                i = parseInt(e.substring(startArrayIndex + 1), 10);
                e = e.substring(0, startArrayIndex);
                type = Object.prototype.toString.call(obj[e]);
                if (type !== "[object Array]") {
                    return undefined;
                }
                return obj[e][i];
            }

        }

    }
    tree.newNodeGeneratedCallback = function ($element, data) {

    }
    tree.ValueChangedCallback = function ($element, data, newValue) {
        data.parentObject[data.parentObjectProperty] = newValue;
    }

    tree.attach = function (view) {
        treeview = view;
        treeview.attr('tabindex', 1)
        treeview.addClass('treeview-root')
        treeview.hover(function() {
            $(this).css('outline','0')
        });
        treeview.keydown(function (e) {
            switch (e.keyCode) {
                case 37://left
                    e.preventDefault();
                    deselect(getActive());
                    setColapse(getActive());
                    break;
                case 39://right
                    e.preventDefault();
                    removeColapse(getActive());
                    break;
                case 38://up
                    e.preventDefault();
                    var prev = getPreviousShowing()
                    if (prev != null) {
                        if (e.shiftKey) {
                            deselect(getActive());
                            setActive(prev);
                        }
                        else {
                            deselect(getActive());
                            setActive(prev);
                            select(getActive());
                        }
                    }
                    break;
                case 40://down
                    e.preventDefault();
                    var next = getNextShowing()
                    if (next != null) {
                        if (e.shiftKey) {
                            select(getActive());
                            select(setActive(next));
                        }
                        else {
                            deselect(getActive());
                            setActive(next);
                            select(getActive());
                        }
                    }
                    break;

                default:
                    break;
            }

        });

        $(document).keydown(function (e) {

            var selectedObjects = treeview.find(".treeview-value.treeview-selected");

            selectedObjects.each(function () {
                switch (e.keyCode) {
                    case 27://esc
                        if ($(this).hasClass("treeview-editing")) {
                            $(this).removeClass("editing")
                            $(this).removeClass("treeview-editing")
                            var myData = $(this).data();
                            $(this).html(myData.parentObject[myData.parentObjectProperty]);
                        }
                        else {
                            treeview.find(".treeview-selected").removeClass("treeview-selected");
                        }
                        break;

                    case 8:
                        if (!$(this).hasClass("treeview-editing")) {
                            $(this).addClass("treeview-editing")
                            $(this).addClass("editing")
                        }
                        $(this).html($(this).html().substring(0, $(this).html().length - 1));
                        break;
                    default:
                        break;
                }

            });
        });
        //Handle entering value
        $(document).keypress(function (event) {

            if (tree.readOnly) return;
            var c = String.fromCharCode(event.which);
            console.log(c);
            console.log(event.which);
            var selectedObjects = treeview.find(".treeview-value.treeview-selected");

            selectedObjects.each(function () {
                if (event.which == 13) {
                    $(this).removeClass("treeview-editing")
                    $(this).removeClass("editing")
                    var myData = $(this).data();
                    executeCallback('valueChanged',$(this), myData, $(this).html());
                    return
                }
                else {

                    if (!$(this).hasClass("treeview-editing")) {
                        $(this).addClass("treeview-editing")
                        $(this).addClass("editing")
                        $(this).html(c);
                    }
                    else {
                        $(this).append(c);
                    }

                }
            });
        });

        $(document).mousedown(function (event) {
            if (!event.shiftKey) {
                var c = String.fromCharCode(event.which);
                var selectedObjects = treeview.find(".treeview-value.treeview-selected");
                selectedObjects.each(function () {
                    $(this).removeClass("treeview-editing")
                    var myData = $(this).data();
                    myData.parentObject[myData.parentObjectProperty] = $(this).html();
                    return
                });
                setActive();
                setSelected();
            }
        });

        view.append();
        tree.refreshView();
    }
};

ATREEVIEW.version = '0.0.1';

// UMD (Universal Module Definition)
if (typeof define === 'function' && define.amd) {
    // AMD
    define('atreeview', ATREEVIEW);
} else if (typeof module === 'object' && typeof module.exports === 'object') {
    // Node.js
    module.exports = ATREEVIEW;
}

// jQuery polyfills - Later
if (typeof jQuery === 'undefined') {
    throw new Error('Polyfill not done! Get jQuery!');
} else {
    ATREEVIEW.prototype.extend = jQuery.extend;
    ATREEVIEW.prototype.isEmptyObject = jQuery.isEmptyObject;
    ATREEVIEW.prototype.each = jQuery.each;
}