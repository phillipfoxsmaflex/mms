import { Box, Button, Card, Container, Stack, styled } from '@mui/material';
import Logo from '../LogoSign';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const HeaderWrapper = styled(Card)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(10)};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: ${theme.zIndex.appBar};
    margin-bottom: 0;
    box-shadow: ${theme.shadows[1]};
    border-radius: 0;
  `
);

const NavbarSpacer = styled(Box)(
  ({ theme }) => `
    height: ${theme.spacing(10)};
  `
);

export default function NavBar() {
  const { t } = useTranslation();

  return (
    <>
      <HeaderWrapper>
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Logo />
          </Stack>
        </Container>
      </HeaderWrapper>
      <NavbarSpacer />
    </>
  );
}
