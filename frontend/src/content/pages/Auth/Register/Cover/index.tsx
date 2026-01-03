import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Box, Card, Container, Link, styled, Typography } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import JWTRegister from '../RegisterJWT';
import { useTranslation } from 'react-i18next';
import Logo from 'src/components/LogoSign';

const Content = styled(Box)(
  ({ theme }) => `
    display: flex;
    flex: 1;
    width: 100%;
    min-height: 100vh;
    background: ${theme.palette.background.default};
  `
);

function RegisterCover() {
  const { t }: { t: any } = useTranslation();
  const [searchParams] = useSearchParams();

  return (
    <>
      <Helmet>
        <title>{t('register')}</title>
      </Helmet>
      <Content>
        <Container
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          maxWidth="sm"
        >
          <Card
            sx={{
              p: 4,
              my: 4,
              width: '100%'
            }}
          >
            <Box textAlign="center" mb={3}>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <Logo />
              </Box>
              <Typography
                variant="h2"
                sx={{
                  mb: 1
                }}
              >
                {t('create_account')}
              </Typography>
              <Typography
                variant="h4"
                color="text.secondary"
                fontWeight="normal"
                sx={{
                  mb: 3
                }}
              >
                {t('signup_description')}
              </Typography>
            </Box>
            <JWTRegister
              email={searchParams.get('email')}
              role={Number(searchParams.get('role'))}
              subscriptionPlanId={searchParams.get('subscription-plan-id')}
            />
            <Box mt={4} textAlign="center">
              <Typography
                component="span"
                variant="subtitle2"
                color="text.primary"
                fontWeight="bold"
              >
                {t('account_already')}
              </Typography>{' '}
              <Link component={RouterLink} to="/account/login">
                <b>{t('signin_here')}</b>
              </Link>
            </Box>
          </Card>
        </Container>
      </Content>
    </>
  );
}

export default RegisterCover;
