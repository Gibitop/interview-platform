# Changelog

## 2.2.0 - Stability update

### Common
- Added active file name to patch content request to minimize sync errors on unreliable internet connection
- Fixed `Uint8Array` serializer crashing with `Maximum call stack size exceeded` error on large patches
- Updated Node.js from version 22.9 to 22.11 (LTS)

### Web
- Fixed icon sizing
- Fixed recording player layout height
- Added a button to hide user names in the code editor
- Added an `__APP_VERSION__` variable on window to check the frontend version
- Added properly disposing of monaco event handlers

### Backend
- Added auto restarting room containers in the event of a crash
- Added a way to use localhost insider when developing outside of docker
- Added deleting containers when stopped by a user or a cron job
- Added `/version` endpoint to check the backend version

### Insider
- Added recording and working directory recovery in the event of a crash
