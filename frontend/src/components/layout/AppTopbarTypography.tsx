import styled from 'styled-components';
import { Paragraph, Title } from '@zendeskgarden/react-notifications';

export const TopbarTitle = styled(Title)`
  && {
    margin: 0;
    color: #ffffff;
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  @media (max-width: 768px) {
    && {
      font-size: 1.125rem;
    }
  }
`;

export const TopbarSubtitle = styled(Paragraph)`
  && {
    margin: 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
    line-height: 1.45;
  }

  @media (max-width: 768px) {
    && {
      font-size: 0.8125rem;
    }
  }
`;

export const TopbarEyebrow = styled(Paragraph)`
  && {
    margin: 0;
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
`;

export const TopbarAsideName = styled(Title)`
  && {
    margin: 0;
    color: #ffffff;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.3;
  }
`;
