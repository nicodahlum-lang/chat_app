import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, RTCView, mediaDevices, MediaStream } from 'react-native-webrtc';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ChatsStackParamList } from '../navigation/types';
import { socketService } from '../services/socket';
import { colors } from '../theme';

type Props = NativeStackScreenProps<ChatsStackParamList, 'Call'>;

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const CallScreen: React.FC<Props> = ({ route, navigation }) => {
    const { conversationId, name, isIncoming, offer } = route.params;

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callStatus, setCallStatus] = useState(isIncoming ? 'Incoming...' : 'Calling...');

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        startCall();

        const unsubscribeAnswer = socketService.onCallAnswer(async (data) => {
            if (data.conversationId === conversationId && peerConnectionRef.current) {
                setCallStatus('Connected');
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        const unsubscribeIce = socketService.onIceCandidate(async (data) => {
            if (data.conversationId === conversationId && peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.log('Error adding ice candidate', e);
                }
            }
        });

        const unsubscribeEnd = socketService.onCallEnd((data) => {
            if (data.conversationId === conversationId) {
                setCallStatus('Call ended');
                setTimeout(() => {
                    endCall();
                }, 1000);
            }
        });

        return () => {
            unsubscribeAnswer();
            unsubscribeIce();
            unsubscribeEnd();
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }
            if (localStream) {
                localStream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    const startCall = async () => {
        try {
            // Get local media
            let isFront = true;
            const sourceInfos = await mediaDevices.enumerateDevices();
            let videoSourceId;
            for (let i = 0; i < sourceInfos.length; i++) {
                const sourceInfo = sourceInfos[i];
                if (sourceInfo.kind == 'videoinput' && sourceInfo.facing == (isFront ? 'front' : 'environment')) {
                    videoSourceId = sourceInfo.deviceId;
                }
            }

            const stream = await mediaDevices.getUserMedia({
                audio: true,
                video: {
                    width: 640,
                    height: 480,
                    frameRate: 30,
                    facingMode: (isFront ? 'user' : 'environment'),
                    deviceId: videoSourceId
                }
            });

            setLocalStream(stream);

            // Setup PC
            const peerConnection = new RTCPeerConnection(ICE_SERVERS as any);
            peerConnectionRef.current = peerConnection;

            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });

            peerConnection.ontrack = (event) => {
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                    setCallStatus('Connected');
                }
            };

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socketService.sendIceCandidate(conversationId, event.candidate);
                }
            };

            if (isIncoming && offer) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socketService.sendCallAnswer(conversationId, answer);
            } else {
                const localOffer = await peerConnection.createOffer({});
                await peerConnection.setLocalDescription(localOffer);
                socketService.sendCallOffer(conversationId, localOffer);
            }
        } catch (e) {
            console.error('Error starting call', e);
            Alert.alert('Error', 'Could not access camera/microphone');
            navigation.goBack();
        }
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
            setIsCameraOff(!isCameraOff);
        }
    };

    const endCall = () => {
        socketService.endCall(conversationId);
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            {remoteStream ? (
                <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
            ) : (
                <View style={styles.placeholderContainer}>
                    <Text style={styles.callStatus}>{callStatus}</Text>
                    <Text style={styles.callerName}>{name}</Text>
                </View>
            )}

            {localStream && !isCameraOff && (
                <View style={styles.localVideoContainer}>
                    <RTCView streamURL={localStream.toURL()} style={styles.localVideo} zOrder={1} objectFit="cover" />
                </View>
            )}

            <View style={styles.controlsContainer}>
                <TouchableOpacity style={[styles.controlButton, isMuted && styles.controlButtonActive]} onPress={toggleMute}>
                    <IconButton icon={isMuted ? "microphone-off" : "microphone"} iconColor={isMuted ? colors.background : colors.text} size={30} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlButton, styles.endCallButton]} onPress={endCall}>
                    <IconButton icon="phone-hangup" iconColor={colors.background} size={30} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.controlButton, isCameraOff && styles.controlButtonActive]} onPress={toggleCamera}>
                    <IconButton icon={isCameraOff ? "video-off" : "video"} iconColor={isCameraOff ? colors.background : colors.text} size={30} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    remoteVideo: {
        flex: 1,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    callStatus: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        marginBottom: 10,
    },
    callerName: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    localVideoContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 100,
        height: 150,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#333',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    localVideo: {
        flex: 1,
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    controlButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonActive: {
        backgroundColor: '#fff',
    },
    endCallButton: {
        backgroundColor: colors.error,
        width: 70,
        height: 70,
        borderRadius: 35,
    },
});
