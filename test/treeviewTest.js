var machine = {};
machine.plc1={};
machine.plc1.bool = 1;
machine.plc1.array1=['dog','cat','woman','man'];
machine.plc1.array2=['dog','cat','woman','man'];
machine.plc1.array3=['dog','cat','woman','man'];
machine.plc1.array4=['dog','cat','woman','man'];
machine.plc1.deep = {};
machine.plc1.deep.deep = {};
machine.plc1.deep.deep.deep = {};
machine.plc1.deep.deep.deep.deep = {};
machine.plc1.deep.deep.deep.deep.deep = {};
machine.plc1.deep.deep.deep.deep.deep.deep = 10;
machine.plc2 = machine.plc1;

function generateTree() {
    designTree = new ATREEVIEW();
    var $projectExplorer = $("#varWatch")

    designTree.newNodeGeneratedCallback = function (element, variable) {
        element.attr("data-plc-var-name", variable.path);
        element.addClass("data-plc-type-num-value");
    };

    designTree.ValueChangedCallback = function (element, variable, value) {
        machine.writeVariable(variable.path, value);
    };

    designTree.attach($projectExplorer);
    designTree.setContext("machine");
//    designTree.newNode("plc1");
//    designTree.newNode("plc2");
    designTree.setColumnNames(['Variable Name', 'Value']);
}

generateTree();