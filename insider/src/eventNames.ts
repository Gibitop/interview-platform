export type C2SEvent =
    | 'change-my-user'
    | 'copy'
    | 'input-to-terminal'
    | 'request-active-file-content'
    | 'patch-active-file-content'
    ;

export type S2CEvent =
    | 'users-changed'
    | 'candidate-copied'
    | 'terminal-outputted'
    | 'active-file-path-changed'
    | 'active-file-content-rewritten'
    | 'active-file-content-patched'
    ;
