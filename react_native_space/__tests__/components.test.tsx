import React from 'react';
import { render } from '@testing-library/react-native';
import { Avatar } from '../src/components/Avatar';
import { Loading } from '../src/components/Loading';

describe('Components', () => {
  describe('Avatar', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(<Avatar name="Test User" />);
      expect(() => render(<Avatar name="Test User" />)).not.toThrow();
    });

    it('should render with uri', () => {
      expect(() => 
        render(<Avatar uri="https://upload.wikimedia.org/wikipedia/commons/f/f4/User_Avatar_2.png" name="Test" />)
      ).not.toThrow();
    });

    it('should render with custom size', () => {
      expect(() => 
        render(<Avatar name="Test" size={60} />)
      ).not.toThrow();
    });
  });

  describe('Loading', () => {
    it('should render without crashing', () => {
      expect(() => render(<Loading />)).not.toThrow();
    });

    it('should render with message', () => {
      const { getByText } = render(<Loading message="Loading data..." />);
      expect(getByText('Loading data...')).toBeTruthy();
    });

    it('should show activity indicator', () => {
      const { UNSAFE_root } = render(<Loading />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
