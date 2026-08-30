'use client';

import { useEffect, useMemo, useState } from 'react';
import { configEnv } from '@/shared/config/env';
import { chatSocketService } from '../services/chat-socket.service';
import {
	ChatReadPayload,
	ChatSendPayload,
	Message,
	MessageStatusPayload,
	OnlineStatusPayload,
	RecordingPayload,
	RecordingUserStatusPayload,
	TypingPayload,
	TypingUserStatusPayload,
} from '../types';

interface UseChatSocketOptions {
	token?: string;
	onMessageReceived?: (message: Message) => void;
	onMessageStatusUpdated?: (payload: MessageStatusPayload) => void;
	onTypingUserStatus?: (payload: TypingUserStatusPayload) => void;
	onRecordingUserStatus?: (payload: RecordingUserStatusPayload) => void;
	onOnlineStatus?: (payload: OnlineStatusPayload) => void;
}

const resolveSocketUrl = () => {
	return configEnv.apiBaseUrl.replace(/\/$/, '');
};

export function useChatSocket(options: UseChatSocketOptions = {}) {
	const [isConnected, setIsConnected] = useState(false);
	const [isReconnecting, setIsReconnecting] = useState(false);
	const socketUrl = useMemo(resolveSocketUrl, []);

	useEffect(() => {
		const unsubscribeConnect = chatSocketService.onConnect(() => {
			setIsConnected(true);
			setIsReconnecting(false);
		});

		const unsubscribeDisconnect = chatSocketService.onDisconnect(() => {
			setIsConnected(false);
			setIsReconnecting(true);
		});

		const unsubscribeError = chatSocketService.onError(() => {
			setIsConnected(false);
			setIsReconnecting(true);
		});

		const unsubscribeReceived = options.onMessageReceived
			? chatSocketService.onMessageReceived(options.onMessageReceived)
			: undefined;

		const unsubscribeStatusUpdated = options.onMessageStatusUpdated
			? chatSocketService.onMessageStatusUpdated(options.onMessageStatusUpdated)
			: undefined;

		const unsubscribeTyping = options.onTypingUserStatus
			? chatSocketService.onTypingUserStatus(options.onTypingUserStatus)
			: undefined;

		const unsubscribeRecording = options.onRecordingUserStatus
			? chatSocketService.onRecordingUserStatus(options.onRecordingUserStatus)
			: undefined;

		const unsubscribeOnline = options.onOnlineStatus
			? chatSocketService.onOnlineStatus(options.onOnlineStatus)
			: undefined;

		chatSocketService.connect(socketUrl, options.token);

		return () => {
			unsubscribeConnect();
			unsubscribeDisconnect();
			unsubscribeError();
			unsubscribeReceived?.();
			unsubscribeStatusUpdated?.();
			unsubscribeTyping?.();
			unsubscribeRecording?.();
			unsubscribeOnline?.();
		};
	}, [
		options.token,
		options.onMessageReceived,
		options.onMessageStatusUpdated,
		options.onTypingUserStatus,
		options.onRecordingUserStatus,
		options.onOnlineStatus,
		socketUrl,
	]);

	return {
		isConnected,
		isReconnecting,
		sendMessage: (payload: ChatSendPayload) => chatSocketService.sendMessage(payload),
		markMessageRead: (payload: ChatReadPayload) => chatSocketService.markMessageRead(payload),
		startTyping: (payload: TypingPayload) => chatSocketService.startTyping(payload),
		stopTyping: (payload: TypingPayload) => chatSocketService.stopTyping(payload),
		startRecording: (payload: RecordingPayload) => chatSocketService.startRecording(payload),
		stopRecording: (payload: RecordingPayload) => chatSocketService.stopRecording(payload),
	};
}
