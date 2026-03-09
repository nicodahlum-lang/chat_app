import React from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { Avatar as PaperAvatar } from 'react-native-paper';
import { colors } from '../theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, isOnline }) => {
  if (uri) {
    return (
      <View style={{ width: size, height: size }}>
        <Image
          source={{ uri }}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          defaultSource={require('../../assets/icon.png')}
        />
        {isOnline && <View style={[styles.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} />}
      </View>
    );
  }

  const initials = name
    ?.split(' ')
    ?.map((word) => word?.[0])
    ?.join('')
    ?.toUpperCase()
    ?.substring(0, 2) ?? '??';

  return (
    <View style={{ width: size, height: size }}>
      <PaperAvatar.Text
        size={size}
        label={initials}
        style={styles.avatar}
      />
      {isOnline && <View style={[styles.onlineDot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, right: 0, bottom: 0 }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.avatarBg,
  },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#10B981', // green
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
