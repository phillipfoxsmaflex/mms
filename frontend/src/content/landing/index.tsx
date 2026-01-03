import { Box, styled } from '@mui/material';
import { Helmet } from 'react-helmet-async';
import NavBar from '../../components/NavBar';
import HeroFree from './HeroFree';

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: auto;
    background: ${theme.palette.common.white};
    flex: 1;
    overflow-x: hidden;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
`
);

function LandingPage() {
  return (
    <OverviewWrapper>
      <Helmet>
        <title>Atlas CMMS - Asset Management</title>
      </Helmet>
      <NavBar />
      <HeroFree />
    </OverviewWrapper>
  );
}

export default LandingPage;
