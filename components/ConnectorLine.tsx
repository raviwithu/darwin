import React from 'react';
import { Point } from '../types';

interface ConnectorLineProps {
    from: Point;
    to: Point;
    isSelected?: boolean; // NEW
    onPointerDown?: (e: React.MouseEvent<SVGLineElement>) => void; // NEW
    protocol?: string;
    lineStyle?: string;
}

/**
 * Renders a single SVG line with arrowhead for direction.
 * Assumes it is rendered within an <svg> container that has a marker with id="arrowhead" in its <defs>.
 */
export const ConnectorLine: React.FC<ConnectorLineProps> = ({ from, to, isSelected = false, onPointerDown, protocol, lineStyle = 'solid' }) => {
    // Calculate angle for arrowhead rotation
    // const dx = to.x - from.x;
    // const dy = to.y - from.y;
    // const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    // Get line style based on protocol
    const getStrokeDasharray = () => {
        if (lineStyle === 'dashed') return '8 4';
        if (lineStyle === 'dotted') return '2 4';
        if (protocol === 'CAN' || protocol === 'LIN') return '10 5';
        if (protocol === 'FlexRay') return '15 5';
        if (protocol === 'Ethernet') return '20 5';
        return undefined; // solid line
    };
    
    // Get color based on protocol
    const getStrokeColor = () => {
        if (isSelected) return '#ef4444'; // Red if selected
        if (protocol === 'CAN') return '#f97316'; // Orange
        if (protocol === 'LIN') return '#eab308'; // Yellow
        if (protocol === 'FlexRay') return '#a855f7'; // Purple
        if (protocol === 'Ethernet') return '#3b82f6'; // Blue
        return '#0891b2'; // Default cyan
    };
    
    return (
        <>
            <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={getStrokeColor()}
                strokeWidth={protocol ? 3 : 2}
                strokeDasharray={getStrokeDasharray()}
                markerEnd="url(#arrowhead)"
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onPointerDown={onPointerDown}
            />
            {protocol && (
                <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={getStrokeColor()}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                    {protocol}
                </text>
            )}
        </>
    );
};
