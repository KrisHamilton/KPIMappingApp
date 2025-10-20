import React from 'react';
import { getBezierPath } from 'reactflow';

function FloatingEdge({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd }) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <g>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
    </g>
  );
}

export default FloatingEdge;