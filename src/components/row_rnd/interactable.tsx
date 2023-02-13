import { DraggableOptions } from '@interactjs/actions/drag/plugin';
import { ResizableOptions } from '@interactjs/actions/resize/plugin';
import { DropzoneOptions } from '@interactjs/actions/drop/plugin';
import { DragEvent, DropEvent, Interactable } from '@interactjs/types';
import interact from 'interactjs';
import { cloneElement, FC, ReactElement, useEffect, useRef } from 'react';

export const InteractComp: FC<{
  interactRef?: React.MutableRefObject<Interactable>;
  draggable: boolean;
  draggableOptions: DraggableOptions;
  resizable: boolean;
  resizableOptions: ResizableOptions;
  dropzone: boolean;
  dropzoneOptions?: DropzoneOptions;
}> = ({ children, interactRef, draggable, resizable, draggableOptions, resizableOptions, dropzone, dropzoneOptions }) => {
  const nodeRef = useRef<HTMLElement>();
  const interactable = useRef<Interactable>();
  const draggableOptionsRef = useRef<DraggableOptions>();
  const resizableOptionsRef = useRef<ResizableOptions>();
  const dropzoneOptionsRef = useRef<DropzoneOptions>();

  useEffect(() => {
    draggableOptionsRef.current = { ...draggableOptions };
    resizableOptionsRef.current = { ...resizableOptions };
    dropzoneOptionsRef.current = { ...dropzoneOptions };
  }, [draggableOptions, resizableOptions, dropzoneOptions]);

  useEffect(() => {
    interactable.current && interactable.current.unset();
    interactable.current = interact(nodeRef.current);
    interactRef.current = interactable.current;
    setInteractions();
  }, [draggable, resizable, dropzone]);

  const setInteractions = () => {
    if (draggable)
      interactable.current.draggable({
        ...draggableOptionsRef.current,
        onstart: (e) => draggableOptionsRef.current.onstart && (draggableOptionsRef.current.onstart as (e: DragEvent) => any)(e),
        onmove: (e) => draggableOptionsRef.current.onmove && (draggableOptionsRef.current.onmove as (e: DragEvent) => any)(e),
        onend: (e) => draggableOptionsRef.current.onend && (draggableOptionsRef.current.onend as (e: DragEvent) => any)(e),
      });
    if (resizable)
      interactable.current.resizable({
        ...resizableOptionsRef.current,
        onstart: (e) => resizableOptionsRef.current.onstart && (resizableOptionsRef.current.onstart as (e: DragEvent) => any)(e),
        onmove: (e) => resizableOptionsRef.current.onmove && (resizableOptionsRef.current.onmove as (e: DragEvent) => any)(e),
        onend: (e) => resizableOptionsRef.current.onend && (resizableOptionsRef.current.onend as (e: DragEvent) => any)(e),
      });

    if (dropzone) {
      // interactable.current.dropzone({
      //   accept: '.timeline-editor-action',
      //   overlap: 0.75,
      //   checker: (dragEvent, event, dropped, dropzone, dropElement, draggable, dragElement) => {
      //     return true;
      //   },
      //   ondropactivate: function (event) {
      //     // add active dropzone feedback
      //     console.log('dropactivate');
      //     event.target.classList.add('drop-active');
      //   },
      //   ondragenter: function (event) {
      //     console.log('ondragenter');
      //     var draggableElement = event.relatedTarget;
      //     var dropzoneElement = event.target;
      //     // feedback the possibility of a drop
      //     dropzoneElement.classList.add('drop-target');
      //     draggableElement.classList.add('can-drop');
      //     // draggableElement.textContent = 'Dragged in';
      //   },
      //   ondragleave: function (event) {
      //     console.log('ondragleave');
      //     // remove the drop feedback style
      //     event.target.classList.remove('drop-target');
      //     event.relatedTarget.classList.remove('can-drop');
      //     // event.relatedTarget.textContent = 'Dragged out';
      //   },
      //   ondrop: function (event) {
      //     console.log('onDropevent', event);
      //     // event.relatedTarget.textContent = 'Dropped';
      //     if (dropzoneOptionsRef.current.ondrop) {
      //       (dropzoneOptionsRef.current.ondrop as (e: DropEvent) => any)(event);
      //     }
      //   },
      //   ondropdeactivate: function (event) {
      //     console.log('ondropdeactivate', event);
      //     // remove active dropzone feedback
      //     event.target.classList.remove('drop-active');
      //     event.target.classList.remove('drop-target');
      //     if (dropzoneOptionsRef.current.ondrop) {
      //       (dropzoneOptionsRef.current.ondrop as (e: DropEvent) => any)(event);
      //     }
      //   },
      // });
    }
  };

  return cloneElement(children as ReactElement, {
    ref: nodeRef,
    draggable: false,
  });
};
