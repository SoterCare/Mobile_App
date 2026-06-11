import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Screen } from '@/components/ui/Screen';

describe('Screen', () => {
  it('renders children (scrolling default)', () => {
    const { getByText } = render(
      <Screen>
        <Text>hi</Text>
      </Screen>
    );
    expect(getByText('hi')).toBeTruthy();
  });

  it('renders children when scroll is disabled', () => {
    const { getByText } = render(
      <Screen scroll={false}>
        <Text>static</Text>
      </Screen>
    );
    expect(getByText('static')).toBeTruthy();
  });
});
