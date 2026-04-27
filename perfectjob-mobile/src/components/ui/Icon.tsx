import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';

export type IconFamily = 'MaterialIcons' | 'Ionicons' | 'Feather';

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  family?: IconFamily;
  style?: ViewStyle;
}

const SIZE_MAP: Record<IconFamily, number> = {
  MaterialIcons: 24,
  Ionicons: 24,
  Feather: 24,
};

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#4B5563',
  family = 'MaterialIcons',
  style,
}) => {
  const adjustedSize = size || SIZE_MAP[family];

  switch (family) {
    case 'Ionicons':
      return (
        <Ionicons
          name={name as any}
          size={adjustedSize}
          color={color}
          style={style}
        />
      );
    case 'Feather':
      return (
        <Feather
          name={name as any}
          size={adjustedSize}
          color={color}
          style={style}
        />
      );
    case 'MaterialIcons':
    default:
      return (
        <MaterialIcons
          name={name as any}
          size={adjustedSize}
          color={color}
          style={style}
        />
      );
  }
};

export default Icon;
