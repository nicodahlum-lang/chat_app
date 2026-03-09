import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Audio } from 'expo-av';
import { colors } from '../theme';

interface AudioPlayerProps {
    uri: string;
    isMyMessage?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri, isMyMessage = false }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        return () => {
            if (sound) {
                sound.unloadAsync();
            }
        };
    }, [sound]);

    const loadAndPlay = async () => {
        try {
            if (sound) {
                if (isPlaying) {
                    await sound.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await sound.playAsync();
                    setIsPlaying(true);
                }
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: true,
            });

            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true },
                onPlaybackStatusUpdate
            );

            setSound(newSound);
            setIsPlaying(true);
            setIsLoaded(true);
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const onPlaybackStatusUpdate = (status: any) => {
        if (status?.isLoaded) {
            setDuration(status.durationMillis ?? 0);
            setPosition(status.positionMillis ?? 0);
            setIsPlaying(status.isPlaying ?? false);
            if (status.didJustFinish) {
                setIsPlaying(false);
                setPosition(0);
                sound?.setPositionAsync(0);
            }
        }
    };

    const formatTime = (ms: number): string => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? position / duration : 0;

    return (
        <View style={styles.container}>
            <Pressable onPress={loadAndPlay} style={styles.playButton}>
                <IconButton
                    icon={isPlaying ? 'pause' : 'play'}
                    size={24}
                    iconColor={isMyMessage ? colors.myBubbleText : colors.primaryLight}
                    style={styles.iconButton}
                />
            </Pressable>
            <View style={styles.waveformContainer}>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${progress * 100}%`,
                                backgroundColor: isMyMessage
                                    ? 'rgba(255,255,255,0.7)'
                                    : colors.primaryLight,
                            },
                        ]}
                    />
                </View>
                <Text
                    style={[
                        styles.duration,
                        isMyMessage ? styles.myDuration : styles.otherDuration,
                    ]}
                >
                    {isPlaying || position > 0
                        ? `${formatTime(position)} / ${formatTime(duration)}`
                        : duration > 0
                            ? formatTime(duration)
                            : '0:00'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 180,
        paddingVertical: 4,
    },
    playButton: {
        marginRight: 4,
    },
    iconButton: {
        margin: 0,
    },
    waveformContainer: {
        flex: 1,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    duration: {
        fontSize: 11,
    },
    myDuration: {
        color: 'rgba(255,255,255,0.6)',
    },
    otherDuration: {
        color: colors.textMuted,
    },
});
