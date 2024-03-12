export interface OaEngineMenu {
  name: string;
  width: number;
  height: number;
  constructor: any;
};

export interface ShapeLine {
  type: 'start' | 'end';
  direction: 'top' | 'left' | 'bottom' | 'right';
  id: string;
};
