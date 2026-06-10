import React, { ReactNode } from 'react';
import { Text, TextStyle } from 'react-native';
import { Type } from '@/theme/tokens';

/** One consistent screen-title style across every screen. */
export const ScreenTitle: React.FC<{ children: ReactNode; style?: TextStyle }> = ({
  children,
  style,
}) => <Text style={[Type.screenTitle, style]}>{children}</Text>;
