export async function openLocalFolder(): Promise<{ type: 'tauri' | 'browser', handle?: any, path?: string } | null> {
  // Check if running in Tauri
  const isTauri = '__TAURI__' in window;

  if (isTauri) {
    try {
      // Use Tauri API
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selectedPath = await open({
        directory: true,
        multiple: false,
      });
      if (selectedPath) {
        return { type: 'tauri', path: selectedPath as string };
      }
    } catch (err) {
      console.error('Error opening directory with Tauri:', err);
      throw err;
    }
  } else {
    // Use File System Access API
    if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await (window as any).showDirectoryPicker();
        return { type: 'browser', handle: directoryHandle };
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error opening directory:', err);
          throw err;
        }
      }
    } else {
      throw new Error('File System Access API is not supported in this browser.');
    }
  }
  return null;
}
