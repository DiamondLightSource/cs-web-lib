export interface DisplayInteractivity {
  editable: boolean;
  crossGridDragEnabled: boolean;
  crossGridDropEnabled: boolean;
}

export const DEFAULT_INTERACTIVITY: DisplayInteractivity = {
  editable: true,
  crossGridDragEnabled: false,
  crossGridDropEnabled: true
};
