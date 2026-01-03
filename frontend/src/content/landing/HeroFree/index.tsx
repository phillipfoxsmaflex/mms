import { Box, Button, Container, Stack, styled } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Logo from '../../../components/LogoSign';

const HeroWrapper = styled(Box)(
  ({ theme }) => `
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-height: calc(100vh - ${theme.spacing(20)});
    padding: ${theme.spacing(4, 0)};
  `
);

const ContentBox = styled(Box)(
  ({ theme }) => `
    text-align: center;
    max-width: 600px;
    padding: ${theme.spacing(4)};
  `
);

function HeroFree() {
  const { t }: { t: any } = useTranslation();

  return (
    <HeroWrapper>
      <Container maxWidth="md">
        <ContentBox>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Logo />
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              component={RouterLink}
              to="/account/login"
              size="large"
              variant="outlined"
              sx={{ minWidth: 180 }}
            >
              {t('login')}
            </Button>
            <Button
              component={RouterLink}
              to="/account/register"
              size="large"
              variant="contained"
              sx={{ minWidth: 180 }}
            >
              {t('register')}
            </Button>
          </Stack>
        </ContentBox>
      </Container>
    </HeroWrapper>
  );
}

export default HeroFree;
