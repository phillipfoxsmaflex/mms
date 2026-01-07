import {
  apiUrl,
  BrandRawConfig,
  brandRawConfig,
  customLogoPaths
} from '../config';
import { useSelector } from '../store';

const DEFAULT_WHITE_LOGO = '/static/images/logo/logo-white.png';
const DEFAULT_DARK_LOGO = '/static/images/logo/logo.png';
const CUSTOM_DARK_LOGO = `${apiUrl}images/custom-logo.png`;
const CUSTOM_WHITE_LOGO = `${apiUrl}images/custom-logo-white.png`;

interface BrandConfig extends BrandRawConfig {
  logo: { white: string; dark: string };
}
export function useBrand(): BrandConfig {
  const defaultBrand: Omit<BrandConfig, 'logo'> = {
    name: 'Maintenance Management System',
    shortName: 'MMS',
    website: '',
    mail: '',
    phone: '',
    addressStreet: '',
    addressCity: ''
  };
  const { isLicenseValid } = useSelector((state) => state.license);
  
  // Determine logo URLs based on runtime configuration and license validity
  const getLogoUrl = (isWhite: boolean): string | null => {
    // Use runtime configuration if available and license is valid
    if (customLogoPaths) {
      if (isLicenseValid == null) {
        return null;
      }
      return isLicenseValid
        ? (isWhite ? customLogoPaths.white : customLogoPaths.dark) || (isWhite ? CUSTOM_DARK_LOGO : CUSTOM_DARK_LOGO)
        : (isWhite ? DEFAULT_WHITE_LOGO : DEFAULT_DARK_LOGO);
    }
    
    // Default logos
    return isWhite ? DEFAULT_WHITE_LOGO : DEFAULT_DARK_LOGO;
  };
  
  return {
    logo: {
      white: getLogoUrl(true),
      dark: getLogoUrl(false)
    },
    ...(isLicenseValid && brandRawConfig ? brandRawConfig : defaultBrand)
  };
}
