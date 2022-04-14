import { emit, getDocumentComponents, loadFontsAsync, on, once, showUI, } from '@create-figma-plugin/utilities'

import { ApplyObjectHandler, CreateObjectHandler, ErrorMessage, InsertCodeHandler } from './types'
import { Component, Style, } from './ui'
import { convertColor, RGBToHex } from './util'

export default function () {


  once<InsertCodeHandler>('INSERT_CODE', async function (code: string) {
    const text = figma.createText()
    await loadFontsAsync([text])
    text.characters = code
    figma.closePlugin()
  })

  on<ApplyObjectHandler>('APPLY_OBJECT', async function (object: Style) {
    const selectedItem = figma.currentPage.selection
    const style = await figma.importStyleByKeyAsync(object.key)
    selectedItem.map((node) => {
      if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "POLYGON") {
        node.fillStyleId = style.id
      } else if (node.type === "TEXT") {
        node.textStyleId = style.id
      }
      else if (node.type === "LINE") {
        node.strokeStyleId = style.id
      }
    })
  })

  on<CreateObjectHandler>('CREATE_OBJECT', async function (object: Component) {
    const viewBounds = figma.viewport.center;
    const node = await figma.importComponentSetByKeyAsync(object.key)
    const readyNode = node.defaultVariant.createInstance()
    figma.currentPage.appendChild(readyNode)
    readyNode.x = viewBounds.x;
    readyNode.y = viewBounds.y;
    //figma.viewport.scrollAndZoomIntoView([readyNode]);

  })


  function serializeNodes(nodes: readonly SceneNode[]) {
    let serializedNodes = JSON.stringify(nodes, [
      "name",
      "type",
      "children",
      "id"
    ]);

    return serializedNodes;
  }

  function createErrorObject(node: SceneNode, type: string, message: string, name: string, value?: string) {

    const error: ErrorMessage = {
      node: node,
      type: type,
      message: message,
      name: name,
      value: value ? value : '',
    }

    return error;
  }

  function determineFill(fills: Paint[]) {
    let fillValues: string[] = [];


    fills.forEach(fill => {
      if (fill.type === "SOLID") {
        let rgbObj = convertColor(fill.color);
        fillValues.push(RGBToHex(rgbObj["r"], rgbObj["g"], rgbObj["b"]));
      } else if (fill.type === "IMAGE") {
        fillValues.push("Image - " + fill.imageHash);
      } else {
        //gradient
        /* const gradientValues = [];
        fill.gradientStops.forEach(gradientStops => {
          let gradientColorObject = convertColor(gradientStops.color);
          gradientValues.push(
            RGBToHex(
              gradientColorObject["r"],
              gradientColorObject["g"],
              gradientColorObject["b"]
            )
          );
        });
        let gradientValueString = gradientValues.toString();
        fillValues.push(`${fill.type} ${gradientValueString}`); */
      }
    });

    return fillValues[0];
  }

  function checkFills(node: SceneNode, errors: ErrorMessage[]) {

    if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "POLYGON" || node.type === 'VECTOR' || node.type === 'TEXT' || node.type === 'LINE') {
      const fills = node.fills as Paint[];

      if (fills.length && node.visible) {
        if (
          node.fillStyleId === "" &&
          fills[0].type !== "IMAGE" &&
          fills[0].visible === true
        ) {
          // We may need an array to loop through fill types.
          errors.push(
            createErrorObject(
              node,
              "fill",
              "Missing fill style",
              node.name,
              determineFill(node.fills as Paint[]),
              
            )
          );
          return errors
        } else {
          return;
        }
      }
    }
  }

  function determineType(node: SceneNode) {
    let errors: ErrorMessage[] = [];
    switch (node.type) {
      case "SLICE":
      case "GROUP": {
        // Groups styles apply to their children so we can skip this node type.
        return errors;
      }
      case "BOOLEAN_OPERATION":
      case "VECTOR": {
        return checkFills(node, errors);
      }
      case "POLYGON":
      case "STAR":
      case "ELLIPSE": {
        return checkFills(node, errors);
      }
      case "FRAME": {
        return checkFills(node, errors);
      }
      case "INSTANCE":
      case "RECTANGLE": {
        return checkFills(node, errors);
      }
      case "COMPONENT": {
        return checkFills(node, errors);
      }
      case "COMPONENT_SET": {
        // Component Set is the frame that wraps a set of variants
        // the variants within the set are still linted as components (lintComponentRules)
        // this type is generally only present where the variant is defined so it
        // doesn't need as many linting requirements.
        return checkFills(node, errors);
      }
      case "TEXT": {
        return checkFills(node, errors);
      }
      case "LINE": {
        return checkFills(node, errors);
      }
      default: {
        // Do nothing
      }
    }
  }


  function lint(nodes: SceneNode[]) {
    let errorArray: {
      id: string,
      children: string[],
    }[] = [];
    let childArray: string[] = [];
    nodes.forEach(node => {
      let newObject: {
        id: string,
        children: string[]
        errors: ErrorMessage[]
        name: string,
      } = {
        id: '',
        children: [],
        errors: [],
        name: ''
      };
      if (node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'GROUP') {
        // Create a new object.


        // Give it the existing node id.
        newObject.id = node.id;
        const lintErrors = determineType(node);
        newObject.name= node.name;
        newObject.errors = lintErrors ? lintErrors : [];

        // Recursively run this function to flatten out children and grandchildren nodes
        if (node.children) {
          node.children.forEach(childNode => {
            childArray.push(childNode.id);
          });

          newObject.children = childArray;
          //console.log(node.children as SceneNode[])
          errorArray.push(...lint(node.children as SceneNode[]))

          // If the layer is locked, pass the optional parameter to the recursive Lint
          // function to indicate this layer is locked.
          /*         if (isLayerLocked === true) {
                    errorArray.push(...lint(node["children"], true));
                  } else {
                    errorArray.push(...lint(node["children"], false));
                  } */
        }

        errorArray.push(newObject);
      } else {
        newObject.id = node.id;
        const lintErrors = determineType(node);
        newObject.name= node.name;

        newObject.errors = lintErrors ? lintErrors : [];
        errorArray.push(newObject);

      }
    });

    return errorArray;
  }



  on('RUN_LINT', () => {
    let errors: ErrorMessage[];
    const currentSelection = figma.currentPage.selection;
    const data = serializeNodes(currentSelection)
    const lints = lint(currentSelection as SceneNode[])
    /*     const lint = currentSelection.map((layer) => {
          return checkFills(layer, errors)
        }) */
    console.log(lints)
    emit('LINT_SELECTION', data)
    emit('LINT_ERROR', lints.reverse())

  })





  showUI({ width: 600, height: 500 })
}