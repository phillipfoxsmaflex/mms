import {
  Box,
  Button,
  Container,
  Stack,
  styled
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { useBrand } from '../../../hooks/useBrand';

const LogoWrapper = styled(Box)(
  ({ theme }) => `
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: ${theme.spacing(4)};
    
    img {
      max-width: 300px;
      width: 100%;
      height: auto;
    }
  `
);

function Hero() {
  const { t }: { t: any } = useTranslation();
  const { isAuthenticated } = useAuth();
  const brandConfig = useBrand();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}
      >
        <LogoWrapper>
          <img
            src={brandConfig.logo.dark}
            alt={brandConfig.name}
          />
        </LogoWrapper>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            component={RouterLink}
            to="/account/login"
            size="large"
            variant="outlined"
          >
            {t('login')}
          </Button>
          <Button
            component={RouterLink}
            to={isAuthenticated ? '/app/work-orders' : '/account/register'}
            size="large"
            variant="contained"
          >
            {t('register')}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}

export default Hero;
