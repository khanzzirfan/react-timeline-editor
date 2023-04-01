import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { ScrollSync } from 'react-virtualized';
import { TimelineEngine } from '../engine/engine';
import { MIN_SCALE_COUNT, PREFIX, START_CURSOR_TIME } from '../interface/const';
import { TimelineEditor, TimelineRow, TimelineState } from '../interface/timeline';
import { checkProps } from '../utils/check_props';
import { getScaleCountByRows, parserPixelToTime, parserTimeToPixel } from '../utils/deal_data';
import { Cursor } from './cursor/cursor';
import { EditArea } from './edit_area/edit_area';
import './timeline.less';
import { TimeArea } from './time_area/time_area';
import interact from 'interactjs';

export const Timeline = React.forwardRef<TimelineState, TimelineEditor>((props, ref) => {
  const checkedProps = checkProps(props);
  const { style, onDrop } = props;
  let {
    effects,
    editorData: data,
    scrollTop,
    autoScroll,
    hideCursor,
    disableDrag,
    scale,
    scaleWidth,
    startLeft,
    minScaleCount,
    onChange,
    autoReRender = true,
    onScroll: onScrollVertical,
  } = checkedProps;

  const engineRef = useRef<TimelineEngine>(new TimelineEngine());
  const domRef = useRef<HTMLDivElement>();
  const areaRef = useRef<HTMLDivElement>();
  const scrollSync = useRef<ScrollSync>();
  const editorDataRef = useRef<TimelineRow[]>(data);

  // 编辑器数据
  const [editorData, setEditorData] = useState(data);
  // scale数量
  const [scaleCount, setScaleCount] = useState(MIN_SCALE_COUNT);
  // 光标距离
  const [cursorTime, setCursorTime] = useState(START_CURSOR_TIME);
  // 是否正在运行
  const [isPlaying, setIsPlaying] = useState(false);

  /** 监听数据变化 */
  useLayoutEffect(() => {
    setScaleCount(Math.max(minScaleCount, getScaleCountByRows(data, { scale })));
    setEditorData(data);
  }, [data, minScaleCount, scale]);

  useEffect(() => {
    editorDataRef.current = data;
  }, [data]);

  useEffect(() => {
    interact('.timeline-editor-edit-row').dropzone({
      accept: '.timeline-editor-action',
      overlap: 0.4,
      ondropactivate: function (event) {
        // add active dropzone feedback
        event.target.classList.add('drop-active');
      },
      ondragenter: function (event) {
        let draggableElement = event.relatedTarget;
        let dropzoneElement = event.target;
        // feedback the possibility of a drop
        dropzoneElement.classList.add('drop-target');
        draggableElement.classList.add('can-drop');
        // draggableElement.textContent = 'Dragged in';
      },
      ondragleave: function (event) {
        // remove the drop feedback style
        event.target.classList.remove('drop-target');
        event.relatedTarget.classList.remove('can-drop');
        // event.relatedTarget.textContent = 'Dragged out';
      },
      ondrop: function (event) {
        if (event) {
          event.stopPropagation();
        }
        const rowId = event.currentTarget.getAttribute('data-rowid');
        const actionId = event.relatedTarget.getAttribute('data-actionid');
        let droppedRowData = null;
        let oldRowId = null;
        let actionData = null;

        editorDataRef.current.forEach((f) => {
          const hasAction = f.actions.find((e) => e.id === actionId);
          if (hasAction) {
            oldRowId = f.id;
            actionData = hasAction;
            const { actions, ...restProps } = f;
            droppedRowData = restProps;
          }
        });
        console.log('editorData', editorDataRef.current, oldRowId, rowId);
        if (oldRowId === rowId) return;
        if (!Array.isArray(editorDataRef.current)) return null;

        const modifiedEditorData = editorDataRef.current.map((er) => {
          if (er.id === rowId) {
            const currActions = er.actions || [];
            const updatedActions = currActions.concat(actionData);
            const nonNullActions = updatedActions.filter((f) => !!f);
            return {
              ...er,
              actions: nonNullActions,
            };
          } else if (er.id === oldRowId) {
            const updatedActions = er.actions.filter((f) => f.id !== actionData.id);
            const nonNullActions = updatedActions.filter((f) => !!f);
            return {
              ...er,
              actions: nonNullActions,
            };
          }
          return er;
        });
        console.log('modifiedEditorData', modifiedEditorData, oldRowId, rowId);
        // update actions
        setEditorData(modifiedEditorData);
        handleEditorDataChange(modifiedEditorData);
        if (onDrop) {
          onDrop(rowId, actionId);
        }
      },
      ondropdeactivate: function (event) {
        event.stopPropagation();
        // remove active dropzone feedback
        event.target.classList.remove('drop-active');
        event.target.classList.remove('drop-target');
        event.relatedTarget.style.removeProperty('top');
      },
    });
  }, []);

  useEffect(() => {
    engineRef.current.effects = effects;
  }, [effects]);

  useEffect(() => {
    engineRef.current.data = editorData;
  }, [editorData]);

  useEffect(() => {
    autoReRender && engineRef.current.reRender();
  }, [editorData]);

  // deprecated
  useEffect(() => {
    scrollSync.current && scrollSync.current.setState({ scrollTop: scrollTop });
  }, [scrollTop]);

  /** 处理主动数据变化 */
  const handleEditorDataChange = (editorData: TimelineRow[]) => {
    const result = onChange(editorData);
    if (result !== false) {
      engineRef.current.data = editorData;
      autoReRender && engineRef.current.reRender();
    }
  };

  /** 处理光标 */
  const handleSetCursor = (param: { left?: number; time?: number; updateTime?: boolean }) => {
    let { left, time, updateTime = true } = param;
    if (typeof left === 'undefined' && typeof time === 'undefined') return;

    if (typeof time === 'undefined') {
      if (typeof left === 'undefined') left = parserTimeToPixel(time, { startLeft, scale, scaleWidth });
      time = parserPixelToTime(left, { startLeft, scale, scaleWidth });
    }

    let result = true;
    if (updateTime) {
      result = engineRef.current.setTime(time);
      autoReRender && engineRef.current.reRender();
    }
    result && setCursorTime(time);
    return result;
  };

  /** 设置scrollLeft */
  const handleDeltaScrollLeft = (delta: number) => {
    scrollSync.current && scrollSync.current.setState({ scrollLeft: Math.max(scrollSync.current.state.scrollLeft + delta, 0) });
  };

  // 处理运行器相关数据
  useEffect(() => {
    const handleTime = ({ time }) => {
      handleSetCursor({ time, updateTime: false });
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePaused = () => setIsPlaying(false);
    engineRef.current.on('setTimeByTick', handleTime);
    engineRef.current.on('play', handlePlay);
    engineRef.current.on('paused', handlePaused);
  }, []);

  // ref 数据
  useImperativeHandle(ref, () => ({
    get target() {
      return domRef.current;
    },
    get listener() {
      return engineRef.current;
    },
    get isPlaying() {
      return engineRef.current.isPlaying;
    },
    get isPaused() {
      return engineRef.current.isPaused;
    },
    setPlayRate: engineRef.current.setPlayRate.bind(engineRef.current),
    getPlayRate: engineRef.current.getPlayRate.bind(engineRef.current),
    setTime: (time: number) => handleSetCursor({ time }),
    getTime: engineRef.current.getTime.bind(engineRef.current),
    reRender: engineRef.current.reRender.bind(engineRef.current),
    play: (param: Parameters<TimelineState['play']>[0]) => engineRef.current.play({ ...param }),
    pause: engineRef.current.pause.bind(engineRef.current),
    setScrollLeft: (val) => {
      scrollSync.current && scrollSync.current.setState({ scrollLeft: Math.max(val, 0) });
    },
    setScrollTop: (val) => {
      scrollSync.current && scrollSync.current.setState({ scrollTop: Math.max(val, 0) });
    },
  }));

  return (
    <div ref={domRef} style={style} className={`${PREFIX} ${disableDrag ? PREFIX + '-disable' : ''}`}>
      <ScrollSync ref={scrollSync}>
        {({ scrollLeft, scrollTop, onScroll }) => (
          <>
            <TimeArea
              {...checkedProps}
              disableDrag={disableDrag || isPlaying}
              setCursor={handleSetCursor}
              cursorTime={cursorTime}
              editorData={editorData}
              scaleCount={scaleCount}
              setScaleCount={setScaleCount}
              onScroll={onScroll}
              scrollLeft={scrollLeft}
            />
            <EditArea
              {...checkedProps}
              ref={(ref) => ((areaRef.current as any) = ref?.domRef.current)}
              disableDrag={disableDrag || isPlaying}
              editorData={editorData}
              cursorTime={cursorTime}
              scaleCount={scaleCount}
              setScaleCount={setScaleCount}
              scrollTop={scrollTop}
              scrollLeft={scrollLeft}
              setEditorData={handleEditorDataChange}
              deltaScrollLeft={autoScroll && handleDeltaScrollLeft}
              onScroll={(params) => {
                onScroll(params);
                onScrollVertical && onScrollVertical(params);
              }}
            />
            {!hideCursor && (
              <Cursor
                {...checkedProps}
                disableDrag={isPlaying}
                scrollLeft={scrollLeft}
                scaleCount={scaleCount}
                setScaleCount={setScaleCount}
                setCursor={handleSetCursor}
                cursorTime={cursorTime}
                editorData={editorData}
                areaRef={areaRef}
                scrollSync={scrollSync}
                deltaScrollLeft={autoScroll && handleDeltaScrollLeft}
              />
            )}
          </>
        )}
      </ScrollSync>
    </div>
  );
});
