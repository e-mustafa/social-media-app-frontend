export * from './chat.types';

// Alias interface compatibility
export type NavigationTab = 'chats' | 'status' | 'channels' | 'communities' | 'calls' | 'settings';
export type AttachmentItem = import('./chat.types').IMessageAttachment;
export type Message = import('./chat.types').IMessage;
export type ChatItem = import('./chat.types').IChat;
export type ChatPresenceStatus = 'online' | 'offline';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type ChatLiveStatus = 'idle' | 'typing' | 'recording';
export type ChatMessageReaction = string;
