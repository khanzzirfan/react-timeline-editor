import React, { FC, useEffect, useRef } from 'react';
import interact from 'interactjs';
import { TimelineRow } from '../../interface/action';
import { CommonProp } from '../../interface/common_prop';
import { prefix } from '../../utils/deal_class_prefix';
import { parserPixelToTime } from '../../utils/deal_data';
import { DragLineData } from './drag_lines';
import { EditAction } from './edit_action';
import './edit_row.less';

export type EditRowProps = CommonProp & {
  areaRef: React.MutableRefObject<HTMLDivElement>;
  rowData?: TimelineRow;
  style?: React.CSSProperties;
  dragLineData: DragLineData;
  setEditorData: (params: TimelineRow[]) => void;
  /** 距离左侧滚动距离 */
  scrollLeft: number;
  /** 设置scroll left */
  deltaScrollLeft: (scrollLeft: number) => void;
  activeDropRowRef: React.MutableRefObject<string>;
};

export const EditRow: FC<EditRowProps> = (props) => {
  const { rowData, style = {}, onClickRow, onDoubleClickRow, onContextMenuRow, areaRef, scrollLeft, startLeft, scale, scaleWidth, activeDropRowRef } = props;
  const nodeRef = useRef<HTMLDivElement>();

  const classNames = ['edit-row'];
  if (rowData?.selected) classNames.push('edit-row-selected');

  const handleTime = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const position = e.clientX - rect.x;
    const left = position + scrollLeft;
    const time = parserPixelToTime(left, { startLeft, scale, scaleWidth });
    return time;
  };

  useEffect(() => {
    interact(nodeRef.current).dropzone({
      accept: '.timeline-editor-action',
      overlap: 0.4,
      ondropactivate: function () {
        activeDropRowRef.current = rowData?.id;
      },
      ondragenter: function () {
        activeDropRowRef.current = rowData?.id;
      },
      ondrop: function () {
        activeDropRowRef.current = rowData?.id;
      },
    });
  }, []);

  return (
    <div
      ref={nodeRef}
      className={`${prefix(...classNames)} ${(rowData?.classNames || []).join(' ')}`}
      data-testid="itemrow"
      data-rowid={rowData?.id}
      style={style}
      onClick={(e) => {
        if (rowData && onClickRow) {
          const time = handleTime(e);
          onClickRow(e, { row: rowData, time: time });
        }
      }}
      onDoubleClick={(e) => {
        if (rowData && onDoubleClickRow) {
          const time = handleTime(e);
          onDoubleClickRow(e, { row: rowData, time: time });
        }
      }}
      onContextMenu={(e) => {
        if (rowData && onContextMenuRow) {
          const time = handleTime(e);
          onContextMenuRow(e, { row: rowData, time: time });
        }
      }}
    >
      {(rowData?.actions || []).map((action) => (
        <EditAction key={action.id} {...props} handleTime={handleTime} row={rowData} action={action} activeDropRowRef={activeDropRowRef} />
      ))}
    </div>
  );
};
