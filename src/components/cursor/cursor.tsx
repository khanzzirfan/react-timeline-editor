import React, { FC, useEffect, useRef, useState } from 'react';
import { ScrollSync } from 'react-virtualized';
import { CommonProp } from '../../interface/common_prop';
import { prefix } from '../../utils/deal_class_prefix';
import { parserPixelToTime, parserTimeToPixel } from '../../utils/deal_data';
import { RowDnd } from '../row_rnd/row_rnd';
import { RowRndApi } from '../row_rnd/row_rnd_interface';
import './cursor.less';

/** 动画时间轴组件参数 */
export type CursorProps = CommonProp & {
  /** 距离左侧滚动距离 */
  scrollLeft: number;
  /** 设置光标位置 */
  setCursor: (param: { left?: number; time?: number }) => boolean;
  /** 时间轴区域dom ref */
  areaRef: React.MutableRefObject<HTMLDivElement>;
  /** 设置scroll left */
  deltaScrollLeft: (delta: number) => void;
  /** 滚动同步ref（TODO: 该数据用于临时解决scrollLeft拖住时不同步问题） */
  scrollSync: React.MutableRefObject<ScrollSync>;
};

export const Cursor: FC<CursorProps> = ({
  disableDrag,
  cursorTime,
  setCursor,
  startLeft,
  timelineWidth,
  scaleWidth,
  scale,
  scrollLeft,
  scrollSync,
  areaRef,
  maxScaleCount,
  deltaScrollLeft,
  onCursorDragStart,
  onCursorDrag,
  onCursorDragEnd,
  editorData = [],
}) => {
  const rowRnd = useRef<RowRndApi>();
  const draggingLeft = useRef<undefined | number>();

  const maxTime = React.useMemo(() => {
    const time = editorData.reduce((prev, cur) => {
      const curMax = cur.actions.reduce((prev, cur) => {
        return Math.max(prev, cur.end);
      }, 0);
      return Math.max(prev, curMax);
    }, 0);
    return time;
  }, [editorData]);

  useEffect(() => {
    if (typeof draggingLeft.current === 'undefined') {
      // 非dragging时，根据穿参更新cursor刻度
      rowRnd.current.updateLeft(parserTimeToPixel(cursorTime, { startLeft, scaleWidth, scale }) - scrollLeft);
    }
  }, [cursorTime, startLeft, scaleWidth, scale, scrollLeft]);

  return (
    <RowDnd
      start={startLeft}
      ref={rowRnd}
      parentRef={areaRef}
      bounds={{
        left: 0,
        right: Math.min(timelineWidth, maxScaleCount * scaleWidth + startLeft - scrollLeft),
      }}
      deltaScrollLeft={deltaScrollLeft}
      enableDragging={!disableDrag}
      enableResizing={false}
      onDragStart={() => {
        onCursorDragStart && onCursorDragStart(cursorTime);
        draggingLeft.current = parserTimeToPixel(cursorTime, { startLeft, scaleWidth, scale }) - scrollLeft;
        rowRnd.current.updateLeft(draggingLeft.current);
      }}
      onDragEnd={() => {
        const time = parserPixelToTime(draggingLeft.current + scrollLeft, { startLeft, scale, scaleWidth });
        setCursor({ time });
        onCursorDragEnd && onCursorDragEnd(time);
        draggingLeft.current = undefined;
      }}
      onDrag={({ left }, scroll = 0) => {
        const scrollLeft = scrollSync.current.state.scrollLeft;

        if (!scroll || scrollLeft === 0) {
          // Calculate the maximum left position based on a 10-second limit
          const maxLeft = parserTimeToPixel(maxTime, { startLeft, scaleWidth, scale }) - scrollLeft;

          // 拖拽时，如果当前left < left min，将数值设置为 left min
          // "When dragging, if the current 'left' value is less than the minimum 'left' value, set the value to the minimum 'left' value."
          if (left < startLeft - scrollLeft) draggingLeft.current = startLeft - scrollLeft;
          else if (left > maxLeft) {
            draggingLeft.current = maxLeft;
          } else {
            draggingLeft.current = left;
          }
        } else {
          // restrict the dragging to the scroll area to maxLeft
          const maxLeft = parserTimeToPixel(maxTime, { startLeft, scaleWidth, scale }) - scrollLeft;
          // 自动滚动时，如果当前left < left min，将数值设置为 left min
          // "When auto-scrolling, if the current 'left' value is less than the minimum 'left' value, set the value to the minimum 'left' value."
          if (draggingLeft.current < startLeft - scrollLeft - scroll) {
            draggingLeft.current = startLeft - scrollLeft - scroll;
          }
          /// restrict the dragging to the scroll area to maxLeft
          // 限制拖拽到scroll区域到maxLeft
          if (draggingLeft.current > maxLeft) {
            draggingLeft.current = maxLeft;
          }
        }
        rowRnd.current.updateLeft(draggingLeft.current);
        const time = parserPixelToTime(draggingLeft.current + scrollLeft, { startLeft, scale, scaleWidth });
        setCursor({ time });
        onCursorDrag && onCursorDrag(time);
        return false;
      }}
    >
      <div className={prefix('cursor')} data-id="cursor">
        <svg className={prefix('cursor-top')} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="7" r="7" fill="#00CCA7" />
        </svg>
        <div className={prefix('cursor-area')} />
      </div>
    </RowDnd>
  );
};
