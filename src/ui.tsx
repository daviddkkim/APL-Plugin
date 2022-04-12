import {
  SearchTextbox,
  Container,
  render,
  VerticalSpace,
  Tabs,
  TabsOption,
  LoadingIndicator,
  Divider
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'

import styles from './styles.css'
import { ApplyObjectHandler, CreateObjectHandler } from './types'


const params: RequestInit = {
  method: 'GET',
  headers: {
    'X-Figma-Token': token
  }

}

async function getStyles(type: string) {
  let scopedUrl;
  if (type === "COMPONENT") {
    scopedUrl = url + componentFile + "/component_sets"
  } else {
    scopedUrl = url + styleFile + "/styles"
  }
  const response = await fetch(scopedUrl, params);
  return await response.json();

}

function Plugin(props: { message: string }) {

  const [colors, setColors] = useState<Style[]>()
  const [components, setComponents] = useState<Component[]>()
  const [tabValue, setTabValue] = useState('FILL')
  const [loadingState, setLoadingState] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setLoadingState(true)
    getStyles(tabValue).then((result) => {

      if (tabValue === "COMPONENT") {
        const components: Component[] = result.meta.component_sets;

        setComponents(components.sort((a, b) => a.name.localeCompare(b.name)))
      } else {

        const styles: Style[] = result.meta.styles;
        const fills = styles.filter(e => e.style_type === tabValue).sort(((a, b) => a.name.localeCompare(b.name)))
        setColors(fills)
      }
      setLoadingState(false)
    })
  }, [tabValue])

  const options: Array<TabsOption> = [
    { children: <div></div>, value: 'FILL' },
    { children: <div></div>, value: 'TEXT' },
    { children: <div></div>, value: 'EFFECT' },
    { children: <div></div>, value: 'COMPONENT' }

  ]

  const handleTabChange = (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setTabValue(value);
  }

  function handleObjectClick(object: Style) {
    emit<ApplyObjectHandler>('APPLY_OBJECT', object)
  }


  const handleSearchChange = (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setSearchValue(value);
  }

  function handleObjectPush(object: Component) {
    emit<CreateObjectHandler>('CREATE_OBJECT', object)
  }


  let object;
  if (tabValue === "COMPONENT") {
    object = components;
    if (object) {
      if (searchValue) {
        object = object.filter((color: Component) => {
          return color.name.toLowerCase().includes(searchValue.toLowerCase()) ? true : color.description.toLowerCase().includes(searchValue.toLowerCase()) ? true : false;
        })
      }
      object = object.map((component: Component) => {
        return (
          <div onClick={() => { handleObjectPush(component) }} className={styles.objectContainer}>
            <img src={component.thumbnail_url} className={styles.image} />
            <span>{component.name}</span>
            <span>{component.description}</span>
          </div>
        )
      })
    }
  } else {
    object = colors;
    if (object) {
      if (searchValue) {
        object = object.filter((color: Style) => {
          return color.name.toLowerCase().includes(searchValue.toLowerCase()) ? true : color.description.toLowerCase().includes(searchValue.toLowerCase()) ? true : false;
        })
      }
      object = object.map((color: Style) => {
        return (
          <div onClick={() => handleObjectClick(color)} className={styles.objectContainer}>
            <img src={color.thumbnail_url} className={styles.image} />
            <span>{color.name}</span>
            <span>{color.description}</span>
          </div>
        )
      })
    }
  }




  const content = loadingState ? (<div className={styles.loadingContainer} >
    <LoadingIndicator />
  </div>) : (
    <div>
      {object && object
      }
      <VerticalSpace space="large" />
    </div>)

  return (
    <Container>
      <VerticalSpace space="small" />
      <Tabs options={options} value={tabValue} onChange={handleTabChange} />
      <VerticalSpace space='small' />
      <Divider />
      <SearchTextbox onInput={handleSearchChange} value={searchValue} />
      <Divider />

      {content}
      <VerticalSpace space="small" />
    </Container>
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
