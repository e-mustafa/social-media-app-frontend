'use client';

import { create } from 'zustand';

interface ChatDialogState {
	isNewConversationOpen: boolean;
	isCreateGroupOpen: boolean;
	setNewConversationOpen: (open: boolean) => void;
	setCreateGroupOpen: (open: boolean) => void;
}

export const useChatDialogStore = create<ChatDialogState>((set) => ({
	isNewConversationOpen: false,
	isCreateGroupOpen: false,
	setNewConversationOpen: (open: boolean) => set({ isNewConversationOpen: open }),
	setCreateGroupOpen: (open: boolean) => set({ isCreateGroupOpen: open }),
}));