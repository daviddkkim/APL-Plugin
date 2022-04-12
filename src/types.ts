import { EventHandler } from '@create-figma-plugin/utilities'
import { Component, Style } from './ui'
export interface InsertCodeHandler extends EventHandler {
  name: 'INSERT_CODE'
  handler: (code: string) => void
}

export interface ApplyObjectHandler extends EventHandler {
  name: 'APPLY_OBJECT'
  handler: (object: Style) => void
}

export interface CreateObjectHandler extends EventHandler {
  name: "CREATE_OBJECT"
  handler: (object: Component) => void
}