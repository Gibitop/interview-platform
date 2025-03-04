export type C2SEvent =
    | 'change-my-user'
    | 'copy'
    | 'input-to-terminal'
    | 'request-active-file-content'
    | 'patch-active-file-content'
    | 'request-active-file-path'
    | 'request-available-files'
    | 'change-active-file-path'
    | 'uploadFile'
    | 'request-notes-content'
    | 'patch-notes-content'
    ;

export type S2CEvent =
    | 'users-changed'
    | 'candidate-copied'
    | 'terminal-outputted'
    | 'active-file-content-rewritten'
    | 'active-file-content-patched'
    | 'active-file-path-changed'
    | 'available-files-changed'
    | 'notes-content-patched'
    | 'notes-content-rewritten'
    ;
