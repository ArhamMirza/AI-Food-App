import { useState } from 'react';
import useNotifications from '../components/chat/useNotifications';

// Define interfaces for type safety
interface NotificationHook {
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const useEditor = () => {
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editorContent, setEditorContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  const { showNotification }: NotificationHook = useNotifications();

  const extractRecipeContent = (content: string): string => {
    const sentences = content.split(/(?<=[.!?])\s+/);
    return sentences.length <= 1 ? content : sentences.slice(1).join(' ').trim();
  };

  const reconstructFullContent = (originalContent: string, editedRecipe: string): string => {
    const sentences = originalContent.split(/(?<=[.!?])\s+/);
    return sentences.length <= 1 ? editedRecipe : `${sentences[0]} ${editedRecipe}`.trim();
  };

  const handleOpenEditor = (content: string, messageIndex: number | null = null): void => {
    setOriginalContent(content);
    setEditorContent(extractRecipeContent(content));
    setEditingMessageIndex(messageIndex);
    setEditorOpen(true);
    setHasUnsavedChanges(false);
  };

  const handleCloseEditor = (): void => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Close anyway?')) return;
    setEditorOpen(false);
    setEditorContent('');
    setOriginalContent('');
    setEditingMessageIndex(null);
    setHasUnsavedChanges(false);
  };

  const handleCopyContent = (): void => {
    navigator.clipboard.writeText(editorContent);
    showNotification('Recipe copied to clipboard!', 'success');
  };

  const updateEditorContent = (content: string): void => {
    setEditorContent(content);
    setHasUnsavedChanges(true);
  };

  return {
    editorOpen,
    editorContent,
    originalContent,
    editingMessageIndex,
    hasUnsavedChanges,
    handleOpenEditor,
    handleCloseEditor,
    handleCopyContent,
    updateEditorContent,
    reconstructFullContent,
    setHasUnsavedChanges,
    setOriginalContent,
  };
};

export default useEditor;