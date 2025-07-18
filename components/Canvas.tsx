import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ElementData, ConnectorData, ElementType, Point, DiagramData } from '../types';
import { ELEMENT_CONFIG, ELEMENT_DIMENSIONS, isContainer, isExpandable } from '../constants';
import { Element } from './Element';
import { ConnectorLine } from './ConnectorLine';
import { InfoIcon } from "./Icons";
import { useMediaQuery } from "../hooks/useMediaQuery";


export interface CanvasHandle {
    addElementAtCenter: (type: ElementType) => void;
}

interface CanvasProps {
    diagram: DiagramData;
    setDiagram: (updater: React.SetStateAction<DiagramData>) => void;
    selectedElementIds: string[];
    setSelectedElementIds: React.Dispatch<React.SetStateAction<string[]>>;
    selectedConnectorIds: string[]; // NEW
    setSelectedConnectorIds: React.Dispatch<React.SetStateAction<string[]>>; // NEW
    exportRef: React.RefObject<HTMLDivElement>;
}

interface Transform {
    x: number;
    y: number;
    scale: number;
}

interface DraggingElementsInfo {
    initialElementsPos: { id: string; x: number; y: number; }[];
    initialPointerPos: Point;
}

interface ResizingElementInfo {
    id:string;
    initialSize: { width: number; height: number };
    initialPointerPos: Point;
}

interface PinchState {
    initialDistance: number;
    initialScale: number;
    initialTransform: Point;
}

const getAttachmentPoint = (el: ElementData, targetCenter: Point, offset = 16): Point => {
    const w = el.width || ELEMENT_CONFIG[el.type].defaultWidth || ELEMENT_DIMENSIONS.width;
    const h = el.height || ELEMENT_CONFIG[el.type].defaultHeight || ELEMENT_DIMENSIONS.height;
    const elCenter = { x: el.x + w / 2, y: el.y + h / 2 };

    const dx = targetCenter.x - elCenter.x;
    const dy = targetCenter.y - elCenter.y;

    if (dx === 0 && dy === 0) return {x: el.x + w/2, y: el.y + h/2};

    const tanA = Math.abs(dy / dx);
    const tanB = h / w;

    let attach: Point;
    if (tanA < tanB) { // Intersects left or right side
        attach = dx > 0 ? { x: el.x + w, y: elCenter.y } : { x: el.x, y: elCenter.y };
    } else { // Intersects top or bottom side
        attach = dy > 0 ? { x: elCenter.x, y: el.y + h } : { x: elCenter.x, y: el.y };
    }
    // Offset the attachment point outward so arrowhead is visible
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return attach;
    const normX = dx / length;
    const normY = dy / length;
    return {
        x: attach.x + normX * offset,
        y: attach.y + normY * offset
    };
};

// Helper: returns true if a point is near a line segment
// function isPointNearLine(p: Point, a: Point, b: Point, threshold = 12): boolean {
//     // Calculate distance from point p to line ab
//     const dx = b.x - a.x;
//     const dy = b.y - a.y;
//     const length = Math.sqrt(dx * dx + dy * dy);
//     if (length === 0) return false;
//     // Project p onto ab, clamp to segment
//     const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (length * length)));
//     const closest = { x: a.x + t * dx, y: a.y + t * dy };
//     const dist = Math.sqrt((p.x - closest.x) ** 2 + (p.y - closest.y) ** 2);
//     return dist <= threshold;
// }

const CanvasComponent: React.ForwardRefRenderFunction<CanvasHandle, CanvasProps> = (
    { diagram: propDiagram, setDiagram, selectedElementIds, setSelectedElementIds, selectedConnectorIds, setSelectedConnectorIds, exportRef },
    ref
) => {
    const [localDiagram, setLocalDiagram] = useState(propDiagram);
    const localDiagramRef = useRef(localDiagram);
    localDiagramRef.current = localDiagram;
    
    useEffect(() => {
        if (JSON.stringify(localDiagram) !== JSON.stringify(propDiagram)) {
            setLocalDiagram(propDiagram);
        }
    }, [propDiagram]);
    
    const { elements, connectors } = localDiagram;

    const canvasRef = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [draggingElement, setDraggingElement] = useState<DraggingElementsInfo | null>(null);
    const [resizingElement, setResizingElement] = useState<ResizingElementInfo | null>(null);
    const [connecting, setConnecting] = useState<{ fromId: string; toPoint: Point; } | null>(null);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isInfoVisible, setIsInfoVisible] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point; } | null>(null);
    const lastPointerPosition = useRef<Point>({ x: 0, y: 0 });
    const pinchState = useRef<PinchState | null>(null);

    const isMobile = useMediaQuery('(max-width: 767px)');
    const pressTimerRef = useRef<number | null>(null);
    const touchDownTargetRef = useRef<{ id: string, pointerPos: Point } | null>(null);

    useLayoutEffect(() => {
        if (elements.length === 0 || !canvasRef.current) return;

        const PADDING = 100;

        const getElWidth = (el: ElementData) => el.width || ELEMENT_CONFIG[el.type].defaultWidth || ELEMENT_DIMENSIONS.width;
        const getElHeight = (el: ElementData) => el.height || ELEMENT_CONFIG[el.type].defaultHeight || ELEMENT_DIMENSIONS.height;

        const minX = Math.min(...elements.map(el => el.x));
        const minY = Math.min(...elements.map(el => el.y));
        const maxX = Math.max(...elements.map(el => el.x + getElWidth(el)));
        const maxY = Math.max(...elements.map(el => el.y + getElHeight(el)));

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        const canvasWidth = canvasRef.current.clientWidth;
        const canvasHeight = canvasRef.current.clientHeight;

        if (contentWidth <= 0 || contentHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
            setTransform({ x: 0, y: 0, scale: 1 });
            return;
        }
        
        const scaleX = canvasWidth / (contentWidth + PADDING * 2);
        const scaleY = canvasHeight / (contentHeight + PADDING * 2);
        const newScale = Math.min(scaleX, scaleY, 1);

        const newX = (canvasWidth - contentWidth * newScale) / 2 - minX * newScale;
        const newY = (canvasHeight - contentHeight * newScale) / 2 - minY * newScale;

        setTransform({ x: newX, y: newY, scale: newScale });
    }, [elements.length > 0 ? elements[0].id : null]); // Re-frame when diagram changes significantly

    const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const worldX = (screenX - rect.left - transform.x) / transform.scale;
        const worldY = (screenY - rect.top - transform.y) / transform.scale;
        return { x: worldX, y: worldY };
    }, [transform]);

    useImperativeHandle(ref, () => ({
        addElementAtCenter: (type: ElementType) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const worldPos = screenToWorld(centerX, centerY);
            const config = ELEMENT_CONFIG[type];
            const newElement: ElementData = {
                id: `el_${Date.now()}`,
                type,
                name: config.defaultName,
                x: worldPos.x - (config.defaultWidth || ELEMENT_DIMENSIONS.width) / 2,
                y: worldPos.y - (config.defaultHeight || ELEMENT_DIMENSIONS.height) / 2,
            };
            if(config.defaultWidth) newElement.width = config.defaultWidth;
            if(config.defaultHeight) newElement.height = config.defaultHeight;

            setDiagram(d => ({ ...d, elements: [...d.elements, newElement]}));
            setSelectedElementIds([newElement.id]);
        }
    }), [screenToWorld, setDiagram, setSelectedElementIds]);

    const startDrag = useCallback((elementId: string, pointerPos: Point) => {
        const targetElement = elements.find(el => el.id === elementId);
        if (!targetElement) return;

        const isSelected = selectedElementIds.includes(elementId);
        let elementsToDrag: ElementData[];

        if (!isSelected) {
            setSelectedElementIds([elementId]);
            elementsToDrag = [targetElement];
        } else {
            elementsToDrag = elements.filter(el => selectedElementIds.includes(el.id));
        }

        setDraggingElement({
            initialElementsPos: elementsToDrag.map(el => ({ id: el.id, x: el.x, y: el.y })),
            initialPointerPos: pointerPos,
        });
    }, [elements, selectedElementIds, setSelectedElementIds]);

    const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
        const isTouch = 'touches' in e;
        if (isTouch) e.preventDefault();
        
        if (isTouch && e.touches.length === 2 && pinchState.current) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDist = Math.sqrt(dx * dx + dy * dy);
            const scaleRatio = newDist / pinchState.current.initialDistance;
            const newScale = pinchState.current.initialScale * scaleRatio;
            const clampedScale = Math.max(0.2, Math.min(newScale, 3));
            
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
            const pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

            const newX = pinchCenterX - (pinchCenterX - transform.x) * (clampedScale / transform.scale);
            const newY = pinchCenterY - (pinchCenterY - transform.y) * (clampedScale / transform.scale);
            
            setTransform({ x: newX, y: newY, scale: clampedScale });
            return;
        }

        const pointer = isTouch ? (e.touches[0] || e.changedTouches[0]) : e;
        if (!pointer) return;
        const currentPointerPosition = { x: pointer.clientX, y: pointer.clientY };

        if (pressTimerRef.current && touchDownTargetRef.current) {
            const dx = currentPointerPosition.x - touchDownTargetRef.current.pointerPos.x;
            const dy = currentPointerPosition.y - touchDownTargetRef.current.pointerPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > 10) { // Drag threshold
                clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
                startDrag(touchDownTargetRef.current.id, touchDownTargetRef.current.pointerPos);
            }
        }

        if (selectionBox) {
            setSelectionBox(c => c ? { ...c, end: screenToWorld(pointer.clientX, pointer.clientY) } : null);
            return;
        }
        
        if (isPanning) {
            const dx = currentPointerPosition.x - lastPointerPosition.current.x;
            const dy = currentPointerPosition.y - lastPointerPosition.current.y;
            setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }));
        } else if (draggingElement) {
            const dx = (currentPointerPosition.x - draggingElement.initialPointerPos.x) / transform.scale;
            const dy = (currentPointerPosition.y - draggingElement.initialPointerPos.y) / transform.scale;
            const draggedIds = new Set(draggingElement.initialElementsPos.map(p => p.id));
            
            // Get all descendant IDs of dragged elements
            const getAllDescendants = (elementId: string, allElements: ElementData[]): string[] => {
                const element = allElements.find(el => el.id === elementId);
                if (!element || !element.children || element.children.length === 0) return [];
                
                const descendants: string[] = [...element.children];
                element.children.forEach(childId => {
                    descendants.push(...getAllDescendants(childId, allElements));
                });
                return descendants;
            };
            
            // Add all descendants to draggedIds
            const allDraggedIds = new Set(draggedIds);
            draggedIds.forEach(id => {
                getAllDescendants(id, localDiagram.elements).forEach(descId => {
                    allDraggedIds.add(descId);
                });
            });
            
            setLocalDiagram(d => ({ ...d, elements: d.elements.map(el => {
                if (!allDraggedIds.has(el.id)) return el;
                const initialPos = draggingElement.initialElementsPos.find(p => p.id === el.id) || 
                                  { id: el.id, x: el.x - dx, y: el.y - dy }; // For descendants not in initial list
                return { ...el, x: initialPos.x + dx, y: initialPos.y + dy };
            })}));

        } else if (resizingElement) {
            const dx = (currentPointerPosition.x - resizingElement.initialPointerPos.x) / transform.scale;
            const dy = (currentPointerPosition.y - resizingElement.initialPointerPos.y) / transform.scale;
            const newWidth = Math.max(80, resizingElement.initialSize.width + dx);
            const newHeight = Math.max(40, resizingElement.initialSize.height + dy);

            setLocalDiagram(d => ({ ...d, elements: d.elements.map(el => 
                el.id === resizingElement.id ? { ...el, width: newWidth, height: newHeight } : el
            )}));

        } else if (connecting) {
            setConnecting(c => c ? { ...c, toPoint: screenToWorld(pointer.clientX, pointer.clientY) } : null);
        }

        lastPointerPosition.current = currentPointerPosition;
    }, [isPanning, draggingElement, resizingElement, connecting, transform, screenToWorld, selectionBox, isMobile, startDrag]);

    const handlePointerUp = useCallback((e: MouseEvent | TouchEvent) => {
        if (draggingElement || resizingElement) {
            // Handle dropping elements into containers
            if (draggingElement) {
                const updatedDiagram = { ...localDiagramRef.current };
                const draggedIds = draggingElement.initialElementsPos.map(p => p.id);
                
                // Check if any dragged element is dropped on a container or expandable component
                draggedIds.forEach(draggedId => {
                    const draggedElement = updatedDiagram.elements.find(el => el.id === draggedId);
                    if (!draggedElement || isContainer(draggedElement.type)) return;
                    
                    const elCenterX = draggedElement.x + (draggedElement.width || ELEMENT_CONFIG[draggedElement.type].defaultWidth || ELEMENT_DIMENSIONS.width) / 2;
                    const elCenterY = draggedElement.y + (draggedElement.height || ELEMENT_CONFIG[draggedElement.type].defaultHeight || ELEMENT_DIMENSIONS.height) / 2;
                    
                    // Find expandable component at drop position (for sub-components)
                    const expandableAtPosition = updatedDiagram.elements.find(el => {
                        if (!isExpandable(el.type) || el.id === draggedId) return false;
                        const w = el.width || ELEMENT_CONFIG[el.type].defaultWidth || ELEMENT_DIMENSIONS.width;
                        const h = el.height || ELEMENT_CONFIG[el.type].defaultHeight || ELEMENT_DIMENSIONS.height;
                        return elCenterX >= el.x && elCenterX <= el.x + w &&
                               elCenterY >= el.y && elCenterY <= el.y + h;
                    });
                    
                    // Find container at drop position
                    const containerAtPosition = updatedDiagram.elements.find(el => {
                        if (!isContainer(el.type) || el.id === draggedId) return false;
                        const w = el.width || ELEMENT_CONFIG[el.type].defaultWidth || ELEMENT_DIMENSIONS.width;
                        const h = el.height || ELEMENT_CONFIG[el.type].defaultHeight || ELEMENT_DIMENSIONS.height;
                        return elCenterX >= el.x && elCenterX <= el.x + w &&
                               elCenterY >= el.y && elCenterY <= el.y + h;
                    });
                    
                    // Determine new parent - expandable takes precedence for sub-components
                    const isSubComponent = [ElementType.Module, ElementType.Service, ElementType.Process, 
                                          ElementType.Driver, ElementType.Firmware, ElementType.Component].includes(draggedElement.type);
                    const newParent = (isSubComponent && expandableAtPosition) ? expandableAtPosition : containerAtPosition;
                    
                    // Update parent-child relationships
                    if (newParent && newParent.id !== draggedElement.parentId) {
                        // Remove from old parent
                        if (draggedElement.parentId) {
                            const oldParent = updatedDiagram.elements.find(el => el.id === draggedElement.parentId);
                            if (oldParent && oldParent.children) {
                                oldParent.children = oldParent.children.filter(id => id !== draggedId);
                            }
                        }
                        
                        // Add to new parent
                        draggedElement.parentId = newParent.id;
                        if (!newParent.children) {
                            newParent.children = [];
                        }
                        if (!newParent.children.includes(draggedId)) {
                            newParent.children.push(draggedId);
                        }
                    } else if (!newParent && draggedElement.parentId) {
                        // Remove from parent if dropped outside any container
                        const oldParent = updatedDiagram.elements.find(el => el.id === draggedElement.parentId);
                        if (oldParent && oldParent.children) {
                            oldParent.children = oldParent.children.filter(id => id !== draggedId);
                        }
                        draggedElement.parentId = undefined;
                    }
                });
                
                setDiagram(updatedDiagram);
            } else {
                setDiagram(localDiagramRef.current);
            }
        }

        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
            if (touchDownTargetRef.current) {
                const id = touchDownTargetRef.current.id;
                const isCurrentlySelected = selectedElementIds.includes(id);
                setSelectedElementIds(prev =>
                    isCurrentlySelected
                        ? prev.filter(selectedId => selectedId !== id)
                        : [...prev, id]
                );
            }
        }
        touchDownTargetRef.current = null;

        if (selectionBox) {
            const { start, end } = selectionBox;
            const selectionRect = {
                minX: Math.min(start.x, end.x),
                minY: Math.min(start.y, end.y),
                maxX: Math.max(start.x, end.x),
                maxY: Math.max(start.y, end.y),
            };

            const idsToSelect = elements
                .filter(el => {
                    const getElWidth = (el: ElementData) => el.width || ELEMENT_CONFIG[el.type].defaultWidth || ELEMENT_DIMENSIONS.width;
                    const getElHeight = (el: ElementData) => el.height || ELEMENT_CONFIG[el.type].defaultHeight || ELEMENT_DIMENSIONS.height;
                    const elRect = {
                        minX: el.x,
                        minY: el.y,
                        maxX: el.x + getElWidth(el),
                        maxY: el.y + getElHeight(el),
                    };
                    return elRect.minX < selectionRect.maxX &&
                           elRect.maxX > selectionRect.minX &&
                           elRect.minY < selectionRect.maxY &&
                           elRect.maxY > selectionRect.minY;
                })
                .map(el => el.id);
            
            setSelectedElementIds(idsToSelect);
            setSelectionBox(null);
        }

        if (connecting) {
            let targetElement: Element | null = null;
            if ('changedTouches' in e) {
                const touch = e.changedTouches[0];
                targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            } else {
                targetElement = e.target as Element;
            }
            const elementDiv = targetElement?.closest('[data-element-id]');
            if (elementDiv) {
                const toId = elementDiv.getAttribute('data-element-id');
                if (toId && toId !== connecting.fromId) {
                    const newConnector: ConnectorData = { id: `conn_${Date.now()}`, from: connecting.fromId, to: toId };
                    const alreadyExists = connectors.some(conn => (conn.from === newConnector.from && conn.to === newConnector.to));
                    if (!alreadyExists) {
                        setDiagram(d => ({ ...d, connectors: [...d.connectors, newConnector] }));
                    }
                }
            }
        }
        
        setIsPanning(false);
        setDraggingElement(null);
        setResizingElement(null);
        setConnecting(null);
        pinchState.current = null;
    }, [connecting, connectors, setDiagram, selectionBox, elements, isMobile, selectedElementIds, setSelectedElementIds, draggingElement, resizingElement]);

    const handleCanvasPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        const isTouch = 'touches' in e.nativeEvent;
        const target = e.target as HTMLElement;

        if (isTouch) {
            const touchEvent = e as React.TouchEvent;
            if (touchEvent.touches.length === 2) {
                if(pressTimerRef.current) clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
                touchDownTargetRef.current = null;

                const dx = touchEvent.touches[0].clientX - touchEvent.touches[1].clientX;
                const dy = touchEvent.touches[0].clientY - touchEvent.touches[1].clientY;
                pinchState.current = {
                    initialDistance: Math.sqrt(dx * dx + dy * dy),
                    initialScale: transform.scale,
                    initialTransform: {x: transform.x, y: transform.y}
                };
                setIsPanning(false);
                return;
            }
        }
        
        const pointer = isTouch ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
        if(!pointer) return;

        if (isSpacePressed && target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            const startPoint = screenToWorld(pointer.clientX, pointer.clientY);
            setSelectionBox({ start: startPoint, end: startPoint });
            return;
        }

        if (target !== e.currentTarget) return; 
        
        if (e.target === e.currentTarget) {
            setSelectedElementIds([]);
        }
        
        if (isTouch || (e as React.MouseEvent).button === 0 || (e as React.MouseEvent).button === 1) {
            e.preventDefault();
            e.stopPropagation();
            setIsPanning(true);
            lastPointerPosition.current = { x: pointer.clientX, y: pointer.clientY };
        }
    };
    
    useEffect(() => {
        const moveHandler = (e: MouseEvent | TouchEvent) => handlePointerMove(e);
        const upHandler = (e: MouseEvent | TouchEvent) => handlePointerUp(e);
        
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
        window.addEventListener('touchmove', moveHandler, { passive: false });
        window.addEventListener('touchend', upHandler);
        window.addEventListener('touchcancel', upHandler);
        
        return () => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('touchend', upHandler);
            window.removeEventListener('touchcancel', upHandler);
        };
    }, [handlePointerMove, handlePointerUp]);

    useEffect(() => {
        const currentCanvas = canvasRef.current;
        if (!currentCanvas) return;

        const handleCustomDrop = (e: Event) => {
            const customEvent = e as CustomEvent;
            const { type, clientX, clientY } = customEvent.detail;
            
            if (type) {
                handleDrop(null, { type, clientX, clientY });
            }
        };

        currentCanvas.addEventListener('hld-drop', handleCustomDrop);
        return () => {
            currentCanvas.removeEventListener('hld-drop', handleCustomDrop);
        };
    }, [screenToWorld, setDiagram]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' && !e.repeat) {
                 if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                    return;
                }
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                setIsSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        if (!isInfoVisible) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (target.closest && !target.closest('.info-container')) {
                setIsInfoVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isInfoVisible]);


    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.03;
        const newScale = e.deltaY < 0 ? transform.scale * zoomFactor : transform.scale / zoomFactor;
        const clampedScale = Math.max(0.2, Math.min(newScale, 3));

        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        
        const newX = mousePos.x - (mousePos.x - transform.x) * (clampedScale / transform.scale);
        const newY = mousePos.y - (mousePos.y - transform.y) * (clampedScale / transform.scale);
        
        setTransform({ x: newX, y: newY, scale: clampedScale });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent | null, touchDropData?: {type: ElementType, clientX: number, clientY: number}) => {
        e?.preventDefault();
        const type = e?.dataTransfer.getData('application/hld-builder/element-type') as ElementType || touchDropData?.type;
        const clientX = e?.clientX || touchDropData?.clientX || 0;
        const clientY = e?.clientY || touchDropData?.clientY || 0;
        
        if (type && canvasRef.current) {
            const worldPos = screenToWorld(clientX, clientY);
            const config = ELEMENT_CONFIG[type];
            
            // Check if dropping on a container or expandable component
            let parentId: string | undefined;
            let adjustedPos = { ...worldPos };
            
            // First check for expandable components (layers) at the drop position
            const expandableElement = elements.find(el => {
                if (!isExpandable(el.type)) return false;
                const w = el.width || ELEMENT_CONFIG[el.type].defaultWidth || ELEMENT_DIMENSIONS.width;
                const h = el.height || ELEMENT_CONFIG[el.type].defaultHeight || ELEMENT_DIMENSIONS.height;
                return worldPos.x >= el.x && worldPos.x <= el.x + w &&
                       worldPos.y >= el.y && worldPos.y <= el.y + h;
            });
            
            // Then check for containers
            const containerElement = elements.find(el => {
                if (!isContainer(el.type)) return false;
                const w = el.width || ELEMENT_CONFIG[el.type].defaultWidth || ELEMENT_DIMENSIONS.width;
                const h = el.height || ELEMENT_CONFIG[el.type].defaultHeight || ELEMENT_DIMENSIONS.height;
                return worldPos.x >= el.x && worldPos.x <= el.x + w &&
                       worldPos.y >= el.y && worldPos.y <= el.y + h;
            });
            
            // Determine parent - expandable components take precedence over containers
            if (expandableElement && !isContainer(type) && !isExpandable(type)) {
                // Dropping a sub-component on an expandable component
                parentId = expandableElement.id;
                
                // Position sub-components in a row below the expandable component
                const existingChildren = elements.filter(el => el.parentId === expandableElement.id);
                const elementW = config.defaultWidth || ELEMENT_DIMENSIONS.width;
                const elementH = config.defaultHeight || ELEMENT_DIMENSIONS.height;
                
                adjustedPos.x = expandableElement.x + 60 + existingChildren.length * (elementW + 10);
                adjustedPos.y = expandableElement.y + (expandableElement.height || ELEMENT_CONFIG[expandableElement.type].defaultHeight || ELEMENT_DIMENSIONS.height) + elementH / 2 + 10;
            } else if (containerElement && !isContainer(type)) {
                parentId = containerElement.id;
                
                // Auto-layout: Calculate position based on existing children
                const existingChildren = elements.filter(el => el.parentId === containerElement.id);
                const containerW = containerElement.width || ELEMENT_CONFIG[containerElement.type].defaultWidth || ELEMENT_DIMENSIONS.width;
                const elementW = config.defaultWidth || ELEMENT_DIMENSIONS.width;
                const elementH = config.defaultHeight || ELEMENT_DIMENSIONS.height;
                
                const padding = 20;
                const headerHeight = 50;
                const spacing = 15; // Space between elements
                
                if (existingChildren.length === 0) {
                    // First child - position at top left with padding
                    adjustedPos.x = containerElement.x + elementW / 2 + padding;
                    adjustedPos.y = containerElement.y + headerHeight + elementH / 2 + padding;
                } else {
                    // Auto-layout based on element type
                    if (type === ElementType.ApplicationLayer || type === ElementType.SystemLayer || 
                        type === ElementType.BootLayer || type === ElementType.HardwareLayer) {
                        // Stack layers vertically
                        const layerOrder = [ElementType.ApplicationLayer, ElementType.SystemLayer, 
                                          ElementType.BootLayer, ElementType.HardwareLayer];
                        const currentIndex = layerOrder.indexOf(type);
                        
                        // Calculate Y position based on layer order
                        let yPos = containerElement.y + headerHeight + padding + elementH / 2;
                        for (let i = 0; i < currentIndex; i++) {
                            const existingLayer = existingChildren.find(child => child.type === layerOrder[i]);
                            if (existingLayer) {
                                const layerHeight = existingLayer.height || ELEMENT_CONFIG[existingLayer.type].defaultHeight || ELEMENT_DIMENSIONS.height;
                                yPos += layerHeight + spacing;
                            }
                        }
                        
                        adjustedPos.x = containerElement.x + containerW / 2;
                        adjustedPos.y = yPos;
                    } else {
                        // For other components, arrange in a grid
                        const cols = Math.floor((containerW - 2 * padding) / (elementW + spacing));
                        const row = Math.floor(existingChildren.length / cols);
                        const col = existingChildren.length % cols;
                        
                        adjustedPos.x = containerElement.x + padding + elementW / 2 + col * (elementW + spacing);
                        adjustedPos.y = containerElement.y + headerHeight + padding + elementH / 2 + row * (elementH + spacing);
                    }
                }
            }
            
            const newElement: ElementData = {
                id: `el_${Date.now()}`,
                type,
                name: config.defaultName,
                x: adjustedPos.x - (config.defaultWidth || ELEMENT_DIMENSIONS.width) / 2,
                y: adjustedPos.y - (config.defaultHeight || ELEMENT_DIMENSIONS.height) / 2,
                parentId,
            };
            if(config.defaultWidth) newElement.width = config.defaultWidth;
            if(config.defaultHeight) newElement.height = config.defaultHeight;

            setDiagram(d => {
                const updatedElements = [...d.elements, newElement];
                // If element has a parent, update parent's children array
                if (parentId) {
                    return {
                        ...d,
                        elements: updatedElements.map(el => 
                            el.id === parentId 
                                ? { ...el, children: [...(el.children || []), newElement.id] }
                                : el
                        )
                    };
                }
                return { ...d, elements: updatedElements };
            });
            setSelectedElementIds([newElement.id]);
        }
    };
    
    const handleElementPointerDown = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        e.stopPropagation();
        setIsPanning(false);

        const isTouch = 'touches' in e.nativeEvent;
        if (!isTouch && (e as React.MouseEvent).button !== 0) return;

        const currentElement = elements.find(el => el.id === id);
        if (!currentElement) return;

        const isCurrentlySelected = selectedElementIds.includes(id);
        const pointer = isTouch ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
        const target = e.target as HTMLElement;

        if (target.dataset.resizeHandle) {
             if (selectedElementIds.length === 1 && isCurrentlySelected) {
                 setResizingElement({
                    id,
                    initialSize: { width: currentElement.width || ELEMENT_CONFIG[currentElement.type].defaultWidth || ELEMENT_DIMENSIONS.width, height: currentElement.height || ELEMENT_CONFIG[currentElement.type].defaultHeight || ELEMENT_DIMENSIONS.height },
                    initialPointerPos: { x: pointer.clientX, y: pointer.clientY },
                });
             }
             return;
        }

        if (isTouch) {
            touchDownTargetRef.current = { id, pointerPos: { x: pointer.clientX, y: pointer.clientY } };
            pressTimerRef.current = window.setTimeout(() => {
                startDrag(id, { x: pointer.clientX, y: pointer.clientY });
                pressTimerRef.current = null;
                touchDownTargetRef.current = null;
            }, 250); // Long press delay
            return;
        }

        if (isSpacePressed) {
            setSelectedElementIds(prev =>
                isCurrentlySelected
                    ? prev.filter(selectedId => selectedId !== id)
                    : [...prev, id]
            );
            return; // Don't start a drag when multi-selecting
        }
        
        startDrag(id, { x: pointer.clientX, y: pointer.clientY });
    };

    const handleRename = useCallback((id: string, newName: string) => {
        setDiagram(d => ({
            ...d,
            elements: d.elements.map(el => (el.id === id ? { ...el, name: newName } : el))
        }));
    }, [setDiagram]);

    const handleStartConnection = useCallback((e: React.MouseEvent | React.TouchEvent, fromId: string) => {
        const fromEl = elements.find(el => el.id === fromId);
        if (fromEl) {
            const isTouch = 'touches' in e.nativeEvent;
            const pointer = isTouch ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
            const startPoint = screenToWorld(pointer.clientX, pointer.clientY);
            setConnecting({ fromId, toPoint: startPoint });
        }
    }, [elements, screenToWorld]);

    // Add connector selection logic
    const handlePointerDownOnConnector = useCallback((e: React.MouseEvent, connectorId: string) => {
        e.stopPropagation();
        if (isSpacePressed) {
            // Multi-select
            setSelectedConnectorIds(ids => ids.includes(connectorId) ? ids.filter(id => id !== connectorId) : [...ids, connectorId]);
        } else {
            // Toggle selection if already selected, else select only this
            setSelectedConnectorIds(ids => ids.length === 1 && ids[0] === connectorId ? [] : [connectorId]);
            setSelectedElementIds([]);
        }
    }, [isSpacePressed, setSelectedConnectorIds, setSelectedElementIds]);

    const getCursor = () => {
        if (selectionBox) return 'crosshair';
        if (isSpacePressed) return 'crosshair';
        if (isPanning || draggingElement) return 'grabbing';
        if (resizingElement) return 'se-resize';
        if (connecting) return 'crosshair';
        return 'grab';
    }

    return (
        <div 
            ref={canvasRef}
            className="flex-grow relative bg-gray-50 rounded-lg shadow-inner overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDrop(e)}
            onWheel={(e: React.WheelEvent<HTMLDivElement>) => handleWheel(e)}
            onMouseDown={handleCanvasPointerDown}
            onTouchStart={handleCanvasPointerDown}
            style={{ 
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.1) 1px, transparent 0)', 
                backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
                backgroundPosition: `${transform.x}px ${transform.y}px`,
                cursor: getCursor(),
                touchAction: 'none'
            }}
        >
            <div
                ref={exportRef}
                className="absolute top-0 left-0"
                style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}
            >
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                >
                    <defs>
                        <marker
                            id="arrowhead"
                            viewBox="0 0 10 10"
                            refX="7.5" // Move arrowhead closer to end
                            refY="5"
                            markerWidth="3.5" // Smaller arrowhead
                            markerHeight="3.5"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#0891b2" />
                        </marker>
                    </defs>
                    <g>
                        {connectors.map(conn => {
                            const fromEl = elements.find(el => el.id === conn.from);
                            const toEl = elements.find(el => el.id === conn.to);
                            if (!fromEl || !toEl) return null;
                            const fromPt = getAttachmentPoint(fromEl, { x: toEl.x + (toEl.width || ELEMENT_DIMENSIONS.width) / 2, y: toEl.y + (toEl.height || ELEMENT_DIMENSIONS.height) / 2 }, 0);
                            const toPt = getAttachmentPoint(toEl, { x: fromEl.x + (fromEl.width || ELEMENT_DIMENSIONS.width) / 2, y: fromEl.y + (fromEl.height || ELEMENT_DIMENSIONS.height) / 2 }, 3); // Smaller offset for arrowhead
                            return (
                                <g key={conn.id}>
                                    {/* Wide transparent line for hit area */}
                                    <line
                                        x1={fromPt.x}
                                        y1={fromPt.y}
                                        x2={toPt.x}
                                        y2={toPt.y}
                                        stroke="transparent"
                                        strokeWidth={24}
                                        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                                        onMouseDown={e => handlePointerDownOnConnector(e, conn.id)}
                                    />
                                    {/* Actual visible connector */}
                                    <ConnectorLine
                                        from={fromPt}
                                        to={toPt}
                                        isSelected={selectedConnectorIds.includes(conn.id)}
                                        onPointerDown={e => handlePointerDownOnConnector(e, conn.id)}
                                    />
                                </g>
                            );
                        })}

                        {connecting && elements.find(el => el.id === connecting.fromId) && (
                             <ConnectorLine 
                                from={getAttachmentPoint(elements.find(el => el.id === connecting.fromId)!, connecting.toPoint)} 
                                to={connecting.toPoint} 
                            />
                        )}
                    </g>
                </svg>

                {selectionBox && (
                    <div
                        style={{
                            position: 'absolute',
                            left: Math.min(selectionBox.start.x, selectionBox.end.x),
                            top: Math.min(selectionBox.start.y, selectionBox.end.y),
                            width: Math.abs(selectionBox.start.x - selectionBox.end.x),
                            height: Math.abs(selectionBox.start.y - selectionBox.end.y),
                            backgroundColor: 'rgba(8, 145, 178, 0.2)',
                            border: '1px solid #0891b2',
                            pointerEvents: 'none',
                        }}
                    />
                )}

                {/* Render elements in proper z-index order: containers first, then children */}
                {elements
                    .sort((a, b) => {
                        // Containers should render first (lower z-index)
                        const aIsContainer = isContainer(a.type);
                        const bIsContainer = isContainer(b.type);
                        if (aIsContainer && !bIsContainer) return -1;
                        if (!aIsContainer && bIsContainer) return 1;
                        // Then by parent-child relationship
                        if (a.parentId === b.id) return 1;
                        if (b.parentId === a.id) return -1;
                        return 0;
                    })
                    .map(el => {
                        const zIndex = el.parentId ? 10 : isContainer(el.type) ? 1 : 5;
                        
                        return (
                            <div key={el.id} style={{ position: 'absolute', zIndex }}>
                                <Element
                                    data={el}
                                    allElements={elements}
                                    onRename={handleRename}
                                    onStartConnection={handleStartConnection}
                                    onPointerDown={(e) => handleElementPointerDown(e, el.id)}
                                    isSelected={selectedElementIds.includes(el.id)}
                                    selectedElementIds={selectedElementIds}
                                    isSpacePressed={isSpacePressed}
                                    renderChildren={isContainer(el.type)}
                                />
                            </div>
                        );
                    })}
            </div>
            <div
                className="fixed bottom-4 right-4 z-50 bg-white rounded-full shadow p-1 cursor-pointer export-ignore info-container md:bottom-6 md:right-6"
                style={{
                    maxWidth: 'calc(100vw - 1rem)',
                    maxHeight: 'calc(100vh - 1rem)',
                }}
            >
                <div className="relative">
                    <button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            if (isInfoVisible) {
                                e.currentTarget.blur();
                            }
                            setIsInfoVisible((v: boolean) => !v);
                        }}
                        aria-expanded={isInfoVisible}
                        aria-controls="info-panel"
                        className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 text-white flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-shadow hover:shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                        aria-label="Show controls info"
                    >
                        <InfoIcon />
                    </button>
                    <div 
                        id="info-panel"
                        className={`absolute bottom-full right-0 sm:mb-2 mb-1 w-max max-w-[calc(100vw-2.5rem)] sm:max-w-none bg-gray-800 text-white text-xs rounded px-2 sm:px-3 py-2 shadow-lg transition-all duration-300 ease-out ${
                            isInfoVisible 
                                ? 'opacity-95 translate-y-0' 
                                : 'opacity-0 translate-y-2 pointer-events-none'
                        }`}
                        style={{
                            wordBreak: 'break-word',
                        }}
                    >
                        <p><b>Scroll/Pinch:</b> Zoom</p>
                        <p><b>Drag Canvas:</b> Pan</p>
                        <p><b>Hold Space + Drag:</b> Area Select</p>
                        <p><b>Hold Space + Click Element:</b> Multi-select</p>
                        <p><b>Tap Element (Touch):</b> Toggle Select</p>
                        <p><b>Long Press (Touch):</b> Drag</p>
                        <p><b>Click/Tap Element + Delete:</b> Remove</p>
                        <p><b>Cmd/Ctrl + Z:</b> Undo</p>
                        <p><b>Cmd/Ctrl + Y:</b> Redo</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Canvas = forwardRef(CanvasComponent);
