import React from 'react';
import { BotIcon, UserIcon } from './Icons';

interface ChatMessageProps {
    sender: 'bot' | 'user';
    children: React.ReactNode;
    isFullWidth?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, children, isFullWidth = false }) => {
    const isBot = sender === 'bot';
    
    // Base width classes: Default is speech-bubble style (max-w-80%), FullWidth is 100%
    const widthClasses = isFullWidth 
        ? 'w-full' 
        : 'max-w-[85%] md:max-w-[80%]';

    return (
        <div className={`flex items-start gap-4 ${isBot ? '' : 'flex-row-reverse'} animate-fade-in`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-white/10 ${isBot ? 'bg-gradient-to-br from-orange-600 to-amber-700' : 'bg-gradient-to-br from-zinc-700 to-zinc-800'}`}>
                {isBot ? <BotIcon /> : <UserIcon />}
            </div>
            
            <div className={`
                ${widthClasses} p-5 rounded-2xl backdrop-blur-md shadow-lg transition-all duration-300 border
                ${isBot 
                    ? 'bg-zinc-900/60 rounded-tl-none border-white/10 text-gray-200' 
                    : 'bg-zinc-800/60 rounded-tr-none border-white/10 text-white'
                }
            `}>
                {children}
            </div>
        </div>
    );
};

export default ChatMessage;