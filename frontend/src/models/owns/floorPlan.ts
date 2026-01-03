import { Audit } from './audit';
import File from './file';

export default interface FloorPlan extends Audit {
  id: number;
  name: string;
  area: number;
  image?: File;
  imageWidth?: number;
  imageHeight?: number;
  displayOrder?: number;
}
