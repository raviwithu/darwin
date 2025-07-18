
import React, { useState, useEffect, useRef } from 'react';
import { ElementData, ElementType } from '../types';
import { ELEMENT_CONFIG, ELEMENT_DIMENSIONS, isContainer, isExpandable } from '../constants';

interface ElementProps {
  data: ElementData;
  allElements?: ElementData[];
  onRename: (id: string, newName: string) => void;
  onStartConnection: (event: React.MouseEvent | React.TouchEvent, id: string) => void;
  onPointerDown: (event: React.MouseEvent | React.TouchEvent) => void;
  isSelected?: boolean;
  selectedElementIds?: string[];
  isSpacePressed?: boolean;
  renderChildren?: boolean;
}

export const Element: React.FC<ElementProps> = ({ data, allElements, onRename, onStartConnection, onPointerDown, isSelected, selectedElementIds, isSpacePressed, renderChildren = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.name);
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  
  const { type, id } = data;
  const config = ELEMENT_CONFIG[type];
  const isTextBox = type === ElementType.TextBox;

  // Auto-enter edit mode for new text boxes
  useEffect(() => {
    if (isTextBox && data.name === config.defaultName && isSelected) {
      setIsEditing(true);
    }
  }, [isSelected, isTextBox, data.name, config.defaultName]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  
  useEffect(() => {
    setName(data.name);
  }, [data.name]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    if (name.trim() === '') {
        setName(data.name); // revert if empty
    } else {
        onRename(id, name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isTextBox) {
      handleNameBlur();
    }
    if(e.key === 'Escape') {
      setIsEditing(false);
      setName(data.name);
    }
  };
  
  const selectionClasses = isSelected 
    ? 'ring-2 ring-cyan-500 shadow-xl' 
    : 'hover:shadow-xl hover:shadow-cyan-400/30';
    
  // Get child elements
  const childElements = allElements?.filter(el => el.parentId === data.id) || [];
  
  let width = data.width || config.defaultWidth || ELEMENT_DIMENSIONS.width;
  let height = data.height || config.defaultHeight || ELEMENT_DIMENSIONS.height;
  
  // Expand height for expandable components when they have children
  if (isExpandable(data.type) && !isContainer(data.type) && childElements.length > 0 && isExpanded) {
    const childHeight = Math.max(...childElements.map(child => 
      (child.height || ELEMENT_CONFIG[child.type].defaultHeight || ELEMENT_DIMENSIONS.height)
    ));
    height = Math.max(height, (data.height || config.defaultHeight || ELEMENT_DIMENSIONS.height) + childHeight + 20);
  }
  
  // Add visual cue for containers with children
  const hasChildren = childElements.length > 0;

  const handleStartConnection = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onStartConnection(e, id);
  }

  const cursorClass = isSpacePressed ? 'cursor-crosshair' : (isTextBox ? 'cursor-text' : 'cursor-grab');

  return (
    <div
      style={{
        left: data.x,
        top: data.y,
        width: width,
        height: height,
      }}
      className={`absolute select-none rounded-lg shadow-md border-2 transition-shadow duration-200 ${cursorClass} ${config.color} ${config.textColor} ${selectionClasses} active:cursor-grabbing ${isContainer(data.type) && childElements.length === 0 ? 'flex items-center justify-center' : ''} ${isContainer(data.type) && hasChildren ? 'overflow-visible' : ''}`}
      onDoubleClick={handleDoubleClick}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      data-element-id={id}
    >
      <div 
        className={`w-full h-full ${isTextBox ? 'p-2' : (isContainer(data.type) ? 'p-4' : 'p-3 flex items-center')}`}
        // Prevent pan when double-clicking to edit text.
        onMouseDown={(e) => { if(isEditing) e.stopPropagation() }}
        onTouchStart={(e) => { if(isEditing) e.stopPropagation() }}
      >
        {isTextBox ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent w-full h-full text-center outline-none resize-none"
            spellCheck="false"
            onMouseDown={(e) => e.stopPropagation()} // Prevent canvas pan when clicking text area
            onTouchStart={(e) => e.stopPropagation()}
          />
        ) : isContainer(data.type) ? (
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center border-b border-gray-300 bg-white bg-opacity-50" style={{ height: '50px' }}>
            <div className="mr-2">{config.icon}</div>
            <div className="flex-grow">
              {isEditing ? (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent w-full font-semibold border-b border-dashed border-gray-400 outline-none"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-semibold break-words">{data.name}</span>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mr-3">{config.icon}</div>
            <div className="flex-grow text-center">
              {isEditing ? (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent w-full text-center border-b border-dashed border-gray-400 outline-none"
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="font-semibold break-words">{data.name}</span>
              )}
            </div>
          </>
        )}
      </div>

      <div 
        className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-500 rounded-full cursor-crosshair border-2 border-white hover:scale-125 transition-transform"
        onMouseDown={handleStartConnection}
        onTouchStart={handleStartConnection}
        title="Drag to connect"
      />

      {isSelected && (
        <div
          data-resize-handle="true"
          className="absolute bottom-[-8px] right-[-8px] w-4 h-4 bg-white border-2 border-cyan-500 rounded-full cursor-se-resize hover:bg-cyan-100"
        />
      )}

      {/* Expand/Collapse button for expandable components */}
      {isExpandable(data.type) && childElements.length > 0 && !isContainer(data.type) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full border border-gray-400 flex items-center justify-center text-xs hover:bg-gray-100"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? '−' : '+'}
        </button>
      )}

      {/* Visual indicator for containers */}
      {renderChildren && isContainer(data.type) && (
        <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ top: '50px', padding: '10px' }}>
          {childElements.length === 0 && (
            <div className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
              Drop components here
            </div>
          )}
        </div>
      )}
      
      {/* Visual indicator for expanded expandable components */}
      {renderChildren && isExpandable(data.type) && !isContainer(data.type) && isExpanded && (
        <div className="absolute left-0 right-0 pointer-events-none" 
             style={{ 
               top: '100%', 
               padding: '5px',
               minHeight: childElements.length === 0 ? '40px' : '0'
             }}>
          {childElements.length === 0 && (
            <div className="w-full h-full border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-xs">
              Drop sub-components here
            </div>
          )}
        </div>
      )}
    </div>
  );
};