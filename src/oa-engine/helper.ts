import { v4 } from 'uuid';

export const getuuid = () => {
  return v4().replaceAll('-', '');
};