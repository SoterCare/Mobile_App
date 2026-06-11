import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react-native';
import { ScreenTitle } from '@/components/ui/ScreenTitle';

describe('ScreenTitle', () => {
  it('renders the title text', () => {
    const { getByText } = render(<ScreenTitle>Profile</ScreenTitle>);
    expect(getByText('Profile')).toBeTruthy();
  });
});
