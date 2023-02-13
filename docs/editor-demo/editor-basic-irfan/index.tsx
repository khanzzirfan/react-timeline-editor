import { cloneDeep } from 'lodash';
import React, { useEffect, useState } from 'react';
import './index.less';
import { mockData, mockEffect } from './mock';
import { Timeline } from '../../../src/components/timeline';

const defaultEditorData = cloneDeep(mockData);

const TimelineEditor = () => {
  const [data, setData] = useState(defaultEditorData);

  return (
    <div className="timeline-editor-example0">
      <Timeline onChange={setData} editorData={data} effects={mockEffect} hideCursor={false} />
    </div>
  );
};

export default TimelineEditor;
