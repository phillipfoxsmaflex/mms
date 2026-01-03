import DocumentManager from '../../components/DocumentManager';
import { AssetDTO } from '../../../../models/owns/asset';

interface PropsType {
  asset: AssetDTO;
}

const AssetDocuments = ({ asset }: PropsType) => {
  return <DocumentManager entityType="ASSET" entityId={asset.id} />;
};

export default AssetDocuments;
