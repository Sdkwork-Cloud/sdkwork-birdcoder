import React, { useState } from 'react';
import { Archive } from 'lucide-react';
import { Button } from 'sdkwork-ide-ui';
import { useToast } from 'sdkwork-ide-commons';

export function ArchivedSettings() {
  const { addToast } = useToast();
  const [threads, setThreads] = useState([
    { id: 1, title: 'Fix authentication bug in login flow', date: '2023-10-25', messages: 14 },
    { id: 2, title: 'Implement dark mode toggle', date: '2023-10-22', messages: 8 },
    { id: 3, title: 'Refactor database connection logic', date: '2023-10-18', messages: 32 }
  ]);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleRestore = (id: number) => {
    setThreads(threads.filter(t => t.id !== id));
    addToast('Thread restored successfully.', 'success');
  };

  const handleDelete = (id: number) => {
    setThreads(threads.filter(t => t.id !== id));
    setDeletingId(null);
    addToast('Thread deleted permanently.', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-[#0e0e11]">
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl font-semibold text-white mb-8">Archived Threads</h1>
        
        {threads.length > 0 ? (
          <div className="space-y-3">
            {threads.map(thread => (
              <div key={thread.id} className="bg-[#18181b] rounded-xl border border-white/10 p-4 flex items-center justify-between group hover:border-white/20 transition-colors">
                <div>
                  <div className="text-white font-medium mb-1">{thread.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span>Archived on {thread.date}</span>
                    <span>•</span>
                    <span>{thread.messages} messages</span>
                  </div>
                </div>
                <div className={`flex items-center gap-2 transition-opacity ${deletingId === thread.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {deletingId === thread.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400 mr-2">Are you sure?</span>
                      <Button variant="ghost" onClick={() => setDeletingId(null)}>Cancel</Button>
                      <Button variant="default" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(thread.id)}>Delete</Button>
                    </div>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => handleRestore(thread.id)}>
                        Restore
                      </Button>
                      <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setDeletingId(thread.id)}>
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#18181b] rounded-xl border border-white/10 overflow-hidden mb-8 p-6 flex flex-col items-center justify-center text-center">
            <Archive size={48} className="text-gray-500 mb-4" />
            <h2 className="text-lg font-medium text-white mb-2">No archived threads</h2>
            <p className="text-sm text-gray-400">
              When you archive a thread, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
