import Rectangle from '../items/Rectangle';
import Circle from '../items/Circle';
import Rhombus from '../items/Rhombus';
import RadiusReatangle from '../items/RadiusRectangle';

export default [
  {
    name: '矩形',
    height: 60,
    width: 100,
    constructor: Rectangle
  },
  {
    name: '圆形',
    height: 60,
    width: 60,
    constructor: Circle
  },
  {
    name: '菱形',
    height: 60,
    width: 100,
    constructor: Rhombus
  },
  {
    name: '圆角矩形',
    height: 60,
    width: 100,
    constructor: RadiusReatangle
  }
];
