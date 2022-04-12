import { getDocumentComponents, loadFontsAsync, on, once, showUI } from '@create-figma-plugin/utilities'

import { ApplyObjectHandler, CreateObjectHandler, InsertCodeHandler } from './types'
import { Component, Style } from './ui'

export default function () {


  once<InsertCodeHandler>('INSERT_CODE', async function (code: string) {
    const text = figma.createText()
    await loadFontsAsync([text])
    text.characters = code
    figma.closePlugin()
  })

  on<ApplyObjectHandler>('APPLY_OBJECT', async function (object: Style){
    const selectedItem = figma.currentPage.selection
    const style = await figma.importStyleByKeyAsync(object.key)
    selectedItem.map((node) => {
      if (node.type === "RECTANGLE" || node.type === "FRAME" || node.type === "COMPONENT" || node.type === "POLYGON"){
        node.fillStyleId = style.id
      } else if (node.type === "TEXT") {
        node.textStyleId = style.id
      } 
      else if ( node.type === "LINE") {
        node.strokeStyleId = style.id
      }
    })
  })

  on<CreateObjectHandler>('CREATE_OBJECT', async function (object: Component){
    const viewBounds = figma.viewport.center;
    const node = await figma.importComponentSetByKeyAsync(object.key)
    const readyNode = node.defaultVariant.createInstance()
    figma.currentPage.appendChild(readyNode)
    readyNode.x = viewBounds.x;
    readyNode.y = viewBounds.y;
    //figma.viewport.scrollAndZoomIntoView([readyNode]);

  })

  showUI({ width: 500, height: 500 })
}
