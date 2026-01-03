import { Box, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import SettingsLayout from '../SettingsLayout';
import useAuth from '../../../../hooks/useAuth';
import { UiConfiguration } from '../../../../models/owns/uiConfiguration';
import { Formik } from 'formik';
import { FieldConfigurationsType } from '../../../../contexts/JWTAuthContext';
import GrayWhiteSelector from '../components/GrayWhiteSelector';
import { useDispatch } from '../../../../store';
import Loading from '../../Analytics/Loading';
import LogoUpload from '../../../../components/LogoUpload';
import { useState } from 'react';

function UiConfigurationSettings() {
  const { t }: { t: any } = useTranslation();
  const dispatch = useDispatch();
  const {
    patchUiConfiguration,
    uploadCustomLogo,
    removeCustomLogo,
    user: { uiConfiguration }
  } = useAuth();
  const fields: { label: string; name: keyof Omit<UiConfiguration, 'id'> }[] = [
    { label: t('work_orders'), name: 'workOrders' },
    { label: t('preventive_maintenance'), name: 'preventiveMaintenance' },
    { label: t('permit_to_work'), name: 'permitToWork' },
    { label: t('statistics'), name: 'statistics' },
    { label: t('requests'), name: 'requests' },
    { label: t('assets'), name: 'assets' },
    { label: t('location'), name: 'locations' },
    { label: t('parts_and_inventory'), name: 'partsAndInventory' },
    { label: t('purchase_orders'), name: 'purchaseOrders' },
    { label: t('meters'), name: 'meters' },
    { label: t('people_teams'), name: 'peopleTeams' },
    { label: t('vendors_customers'), name: 'vendorsAndCustomers' },
    { label: t('categories'), name: 'categories' },
    { label: t('files'), name: 'files' },
    { label: t('settings'), name: 'settings' }
  ];

  const options: { label: string; value: string }[] = [
    { label: t('show'), value: true.toString() },
    { label: t('hide'), value: false.toString() }
  ];

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadSuccess(false);
      await uploadCustomLogo(file);
      setUploadSuccess(true);
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    try {
      setIsUploading(true);
      await removeCustomLogo();
      setUploadSuccess(false);
    } catch (error) {
      console.error('Error removing logo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Formik initialValues={{}} onSubmit={() => null}>
      {({
        errors,
        handleBlur,
        handleChange,
        handleSubmit,
        isSubmitting,
        touched,
        values
      }) => (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box p={4}>
                {uiConfiguration ? (
                  <GrayWhiteSelector
                    fields={fields}
                    options={options}
                    onFieldChange={(
                      field,
                      value,
                      type: FieldConfigurationsType
                    ) =>
                      patchUiConfiguration({
                        ...uiConfiguration,
                        [field]: value === 'true'
                      })
                    }
                    getValue={(field) => uiConfiguration[field.name]}
                  />
                ) : (
                  <Loading />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box p={4}>
                <LogoUpload
                  currentLogo={uiConfiguration?.customLogo}
                  onLogoUpload={handleLogoUpload}
                  onLogoRemove={handleLogoRemove}
                  isUploading={isUploading}
                  uploadSuccess={uploadSuccess}
                />
              </Box>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
}

export default UiConfigurationSettings;
