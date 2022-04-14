import {
    Disclosure,
    Divider,
    Text,
    Button,
    IconLayerFrame16,
    IconLayerText16,
    IconLayerInstance16,
    IconCaretRight16,
    IconCaretDown16,
    IconLayerGroup16,
    IconLayerRectangle16
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { Component, Style } from './ui'
import styles from './styles.css'
import { Layer } from './types'

interface LayerListItemProps {
    onClick: (id: string) => void;
    layer: Layer;
    openItems: string[];
}

const LayerListItem = (props: LayerListItemProps) => {
    let layers = null;

    if (props.layer.children && props.layer.children.length > 0) {
        layers = props.layer.children.map((childLayer) => {
            return <LayerListItem onClick={props.onClick} layer={childLayer} openItems={props.openItems} />
        })
    }

    const icon = props.layer.type === 'FRAME' ? <IconLayerFrame16 /> : props.layer.type === 'TEXT' ? <IconLayerText16 /> : props.layer.type === 'INSTANCE' ? <IconLayerInstance16 /> : props.layer.type === 'GROUP' ? <IconLayerGroup16 />
        : props.layer.type === 'RECTANGLE' ? <IconLayerRectangle16 /> : null
    const isOpen = props.openItems.some((item) => item === props.layer.id) ? true : false;
    return (
        <ul className={styles.linterLayerList} >
            <li className={styles.linterLayerContainer} onClick={() => { props.onClick(props.layer.id) }}>
                {props.layer.children && props.layer.children.length > 0 && isOpen ? <IconCaretDown16 color={'black-30'} /> : props.layer.children && props.layer.children.length > 0 ? <IconCaretRight16 color={'black-30'} /> : null}
                {icon}
                <Text> {props.layer.name} </Text>
            </li>
            {layers && isOpen ? <ul className={styles.linterLayerList}> {layers} </ul> : null}
        </ul>)

}

function Linter() {

    const [selectedComponent, setSelectedComponent] = useState<Layer[]>([])
    const [openLayers, setOpenLayers] = useState<string[]>([''])

    const handleLayerClick = (id: string) => {
        console.log(id)
        if (openLayers.includes(id)) {
            const newOpenLayers = openLayers.filter((layer) => { return layer !== id })
            setOpenLayers(newOpenLayers)

        } else {
            const newOpenLayers = [...openLayers, id]
            setOpenLayers(newOpenLayers)
        }
    }
    const handleRunLint = () => {
        emit('RUN_LINT')
    }
    useEffect(() => {
        on("LINT_SELECTION", (data) => {
            const layers = JSON.parse(data)
            setSelectedComponent(layers)
        })

        on("LINT_ERROR", (data)=> {
            console.log(data)
        })
    }, [])

    return (
        <div>
            <div className={styles.linterBodyContainer}>
                {selectedComponent.length >= 1 ? selectedComponent.map((component) => {
                    return (
                        <LayerListItem onClick={handleLayerClick} layer={component} openItems={openLayers} />)
                }) : null}
            </div>
            <Divider />

            <div className={styles.linterActionButtonContainer}>
                <Button onClick={handleRunLint}>Lint</Button>
                <Button secondary>Next Error</Button>
            </div>
        </div>
    )
}


export default Linter;
