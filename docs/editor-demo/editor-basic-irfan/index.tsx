import { cloneDeep } from 'lodash';
import React, { useEffect, useState } from 'react';
import './index.less';
import { mockData, mockEffect } from './mock';
import { Timeline } from '../../../src/components/timeline';

const defaultEditorData = cloneDeep(mockData);

const TimelineEditor = () => {
  const [data, setData] = useState(defaultEditorData);

  React.useEffect(() => {
    console.log('data updated', data);
  }, [data]);

  const handleOnMoveEnd = (...params) => {
    console.log('actionMoveEnd', params);
  };

  const handleOnResizeEnd = (...params) => {
    console.log('handleOnResizeEnd', params);
  };

  const handleOnClickRow = (...params) => {
    console.log('handleOnClickRow', params);
  };

  const handleOnContextMenuRow = (...params) => {
    console.log('handleOnContextMenuRow', params);
  };

  return (
    <div className="timeline-editor-example0">
      <Timeline
        onChange={setData}
        editorData={data}
        effects={mockEffect}
        hideCursor={false}
        autoScroll
        autoReRender
        onActionMoveEnd={handleOnMoveEnd}
        onActionResizeEnd={handleOnResizeEnd}
        onClickActionOnly={handleOnClickRow}
        onContextMenuAction={handleOnContextMenuRow}
        gridSnap
        dragLine
      />
    </div>
  );
};

export default TimelineEditor;
