import {
  SearchTextbox,
  Container,
  render,
  VerticalSpace,
  Tabs,
  TabsOption,
  LoadingIndicator,
  Divider,
  Text,
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import Styler from './styler'
import Linter from './linter'
import styles from './styles.css'
import { ApplyObjectHandler, CreateObjectHandler } from './types'


function Plugin(props: { message: string }) {
  const [selection, setSelection] = useState('')
  return (
    selection === 'style' ? <Styler></Styler> : selection === 'linter' ? <Linter></Linter> :
      <div>
        <div className={styles.objectContainer} onClick={() => { setSelection('style') }}>
          <Text bold>Style</Text>
        </div>
        <div className={styles.objectContainer} onClick={() => { setSelection('linter') }}>
          <Text bold>Linter</Text>
        </div>
        <div className={styles.objectContainer}>
          <Text bold>Table Maker</Text>
        </div>
      </div>
  )
}


export type Style = {
  key: string,
  file_key: string,
  node_id: string,
  style_type: string,
  thumbnail_url: string,
  name: string,
  description: string,
  created_at: string,
  updated_at: string,
  user: object,
  sort_position: string
}

export type Component = {
  key: string,
  file_key: string,
  node_id: string,
  thumbnail_url: string,
  name: string,
  description: string,
  created_at: string,
  updated_at: string,
  user: object,
  containing_frame: any,
  containing_page: any,
}

export default render(Plugin)
