import { useEffect } from 'react';
import { globalEventBus } from '../utils/EventBus';
import { useToast } from '../contexts/ToastProvider';

export function useThreadActions(
  currentProjectId: string | undefined,
  createThread: (projectId: string, name: string) => Promise<any>,
  onThreadCreated: (threadId: string) => void
) {
  const { addToast } = useToast();

  useEffect(() => {
    const handleCreateNewThread = async () => {
      if (!currentProjectId) {
        addToast('Please select a project first', 'error');
        return;
      }
      try {
        const newThread = await createThread(currentProjectId, 'New Thread');
        onThreadCreated(newThread.id);
        addToast('Thread created successfully', 'success');
        // Give the UI a tiny bit of time to render the new thread chat view, then focus
        setTimeout(() => {
          globalEventBus.emit('focusChatInput');
        }, 100);
      } catch (error) {
        console.error("Failed to create thread", error);
        addToast('Failed to create thread', 'error');
      }
    };

    const unsubscribe = globalEventBus.on('createNewThread', handleCreateNewThread);
    return () => {
      unsubscribe();
    };
  }, [currentProjectId, createThread, onThreadCreated, addToast]);
}
