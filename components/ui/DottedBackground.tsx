import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

export const DottedBackground = () => (
  <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
    <Defs>
      <Pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <Circle cx="16" cy="16" r="1.5" fill="#e5e7eb" />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#dots)" />
  </Svg>
);
