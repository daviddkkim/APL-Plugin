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
    IconLayerRectangle16,
    IconWarning16,
    TextboxColor
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'
import { Component, Style } from './ui'
import styles from './styles.css'
import { Layer, ErrorLayer, ErrorMessage } from './types'

interface LayerListItemProps {
    onOpen: (id: string) => void;
    onSelect: (id: string) => void;
    layer: Layer;
    openItems: string[];
    errorItems: ErrorMessage[];
    selectedItem?: string;
}

const LayerListItem = (props: LayerListItemProps) => {
    let layers = null;


    if (props.layer.children && props.layer.children.length > 0) {
        layers = props.layer.children.map((childLayer) => {
            return <LayerListItem onOpen={props.onOpen} onSelect={props.onSelect} layer={childLayer} openItems={props.openItems} errorItems={props.errorItems} selectedItem={props.selectedItem} />
        })
    }

    const icon = props.layer.type === 'FRAME' ? <IconLayerFrame16 /> : props.layer.type === 'TEXT' ? <IconLayerText16 /> : props.layer.type === 'INSTANCE' ? <IconLayerInstance16 /> : props.layer.type === 'GROUP' ? <IconLayerGroup16 />
        : props.layer.type === 'RECTANGLE' ? <IconLayerRectangle16 /> : null
    const isOpen = props.openItems.some((item) => item === props.layer.id) ? true : false;
    const isError = props.errorItems.some((item) => item.node.id === props.layer.id)
    const selectedStyle = props.selectedItem === props.layer.id ? styles.linterActiveContainer : styles.linterLayerContainer;


    const handleClick = (event: h.JSX.TargetedMouseEvent<HTMLLIElement> | h.JSX.TargetedMouseEvent<SVGSVGElement>, id: string) => {
        if (event.currentTarget.nodeName === 'svg') {
            event.stopPropagation();
            props.onOpen(id)
        }
        if (event.currentTarget.nodeName === 'LI') {
            props.onSelect(id)
        }
    }


    return (
        <ul className={styles.linterLayerList} >
            <li className={selectedStyle} onClick={(event) => { handleClick(event, props.layer.id) }} style={{ background: selectedStyle }}>
                <div className={styles.linterIconNameContainer}>
                    {props.layer.children && props.layer.children.length > 0 && isOpen ? <IconCaretDown16 color={'black-30'} onClick={(event) => { handleClick(event, props.layer.id) }} /> : props.layer.children && props.layer.children.length > 0 ? <IconCaretRight16 color={'black-30'} onClick={(event) => { handleClick(event, props.layer.id) }} /> : null}
                    {icon}
                    <Text> {props.layer.name} </Text>
                </div>
                {isError ? <IconWarning16 color={'red'} /> : null}
            </li>
            {layers && isOpen ? <ul className={styles.linterLayerList}> {layers} </ul> : null}
        </ul>)

}

const ErrorMessageItem = (error: ErrorMessage) => {

    return (<div style={{ display: 'flex', flexDirection: 'column', rowGap: '10px' }}>
        <div style={{ display: 'flex', columnGap: '10px', alignItems: 'center', paddingBottom: '10px' }}>
            <Text bold>{error.name}</Text>

        </div>
        <div style={{ display: 'flex', columnGap: '10px', alignItems: 'center' }}>
            <Text>Error Type:</Text>
            <Text bold>{error.type}</Text>

        </div>
        <div style={{ display: 'flex', columnGap: '10px', alignItems: 'center' }}>
            <Text>Error Message:</Text>
            <Text bold> {error.message}</Text>

        </div>
        <div style={{ display: 'flex', columnGap: '10px', alignItems: 'center' }}>
            <Text>Current:</Text>
            <Text bold> {error.value}</Text>
        </div>

    </div>)
}

function Linter() {

    const [selectedComponent, setSelectedComponent] = useState<Layer[]>([])
    const [openLayers, setOpenLayers] = useState<string[]>([''])
    const [errorLayers, setErrorLayers] = useState<ErrorMessage[]>([])
    const [selectedLayer, setSelectedLayer] = useState<string>()

    const handleOpenClick = (id: string) => {
        if (openLayers.includes(id)) {
            const newOpenLayers = openLayers.filter((layer) => { return layer !== id })
            setOpenLayers(newOpenLayers)

        } else {
            const newOpenLayers = [...openLayers, id]
            setOpenLayers(newOpenLayers)
        }
    }
    const handleSelectClick = (id: string) => {
        setSelectedLayer(id)
    }
    const handleRunLint = () => {
        emit('RUN_LINT')
    }
    useEffect(() => {
        on("LINT_SELECTION", (data) => {
            const layers = JSON.parse(data)
            setSelectedComponent(layers)
            setOpenLayers([])
        })

        on("LINT_ERROR", (data: ErrorLayer[]) => {
            let errors: ErrorMessage[] = [];
            data.map((errorLayer) => {
                errors.push(...errorLayer.errors)
            })
            if (errors.length > 0) {
                setErrorLayers(errors)
            }
        })
    }, [])

    const errorLayerSelected = errorLayers.filter((errorLayer) => {
        if (errorLayer.node.id === selectedLayer) return errorLayer
    })
    const handleNextError = () => {
        if (errorLayerSelected.length>0) {
            const copyErrorLayers = [...errorLayers]
            console.log(copyErrorLayers)
            const index = copyErrorLayers.findIndex((item)=> item.node.id === errorLayerSelected[0].node.id);
            const newSelectedLayer = copyErrorLayers[index+1].node.id;
            console.log(newSelectedLayer)
            console.log(selectedLayer)
            setSelectedLayer(newSelectedLayer)
        } else {
            const copyErrorLayers = [...errorLayers];

            const newSelectedLayer = copyErrorLayers[0].node.id;

            setSelectedLayer(newSelectedLayer)
        }
    }
    return (
        <div className={styles.linterMainContainer}>
            <div className={styles.linterLeftContainer}>
                <div className={styles.linterBodyContainer}>
                    {selectedComponent.length >= 1 ? selectedComponent.map((component) => {
                        return (
                            <LayerListItem onOpen={handleOpenClick} onSelect={handleSelectClick} layer={component} openItems={openLayers} errorItems={errorLayers} selectedItem={selectedLayer} />)
                    }) : null}

                </div>
                <Divider />

                <div className={styles.linterActionContainer}>
                    <div className={styles.linterActionButtonContainer} >
                        <Button onClick={handleRunLint}>Lint</Button>
                        <Button secondary onClick={handleNextError}>Next Error</Button>
                    </div>
                    <div className={styles.linterTotalErrorPill}>
                        {errorLayers.length}
                    </div>
                </div>
            </div>

            <div style={{ width: '250px', borderLeft: '1px solid #e5e5e5', paddingLeft: '10px', paddingTop: '10px' }}>
                {errorLayerSelected.length > 0 ? ErrorMessageItem(errorLayerSelected[0]) : 'Select a layer with an error'}
            </div>
        </div>
    )
}


export default Linter;
