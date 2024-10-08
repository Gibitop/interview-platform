/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as RoomsImport } from './routes/rooms'
import { Route as IndexImport } from './routes/index'
import { Route as RecordingsIndexImport } from './routes/recordings/index'
import { Route as RoomsRoomIdImport } from './routes/rooms_.$roomId'
import { Route as RecordingsFromFileImport } from './routes/recordings/from-file'
import { Route as RecordingsRecordingIdImport } from './routes/recordings/$recordingId'

// Create/Update Routes

const RoomsRoute = RoomsImport.update({
  path: '/rooms',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const RecordingsIndexRoute = RecordingsIndexImport.update({
  path: '/recordings/',
  getParentRoute: () => rootRoute,
} as any)

const RoomsRoomIdRoute = RoomsRoomIdImport.update({
  path: '/rooms/$roomId',
  getParentRoute: () => rootRoute,
} as any)

const RecordingsFromFileRoute = RecordingsFromFileImport.update({
  path: '/recordings/from-file',
  getParentRoute: () => rootRoute,
} as any)

const RecordingsRecordingIdRoute = RecordingsRecordingIdImport.update({
  path: '/recordings/$recordingId',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/rooms': {
      id: '/rooms'
      path: '/rooms'
      fullPath: '/rooms'
      preLoaderRoute: typeof RoomsImport
      parentRoute: typeof rootRoute
    }
    '/recordings/$recordingId': {
      id: '/recordings/$recordingId'
      path: '/recordings/$recordingId'
      fullPath: '/recordings/$recordingId'
      preLoaderRoute: typeof RecordingsRecordingIdImport
      parentRoute: typeof rootRoute
    }
    '/recordings/from-file': {
      id: '/recordings/from-file'
      path: '/recordings/from-file'
      fullPath: '/recordings/from-file'
      preLoaderRoute: typeof RecordingsFromFileImport
      parentRoute: typeof rootRoute
    }
    '/rooms/$roomId': {
      id: '/rooms/$roomId'
      path: '/rooms/$roomId'
      fullPath: '/rooms/$roomId'
      preLoaderRoute: typeof RoomsRoomIdImport
      parentRoute: typeof rootRoute
    }
    '/recordings/': {
      id: '/recordings/'
      path: '/recordings'
      fullPath: '/recordings'
      preLoaderRoute: typeof RecordingsIndexImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/rooms': typeof RoomsRoute
  '/recordings/$recordingId': typeof RecordingsRecordingIdRoute
  '/recordings/from-file': typeof RecordingsFromFileRoute
  '/rooms/$roomId': typeof RoomsRoomIdRoute
  '/recordings': typeof RecordingsIndexRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/rooms': typeof RoomsRoute
  '/recordings/$recordingId': typeof RecordingsRecordingIdRoute
  '/recordings/from-file': typeof RecordingsFromFileRoute
  '/rooms/$roomId': typeof RoomsRoomIdRoute
  '/recordings': typeof RecordingsIndexRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/rooms': typeof RoomsRoute
  '/recordings/$recordingId': typeof RecordingsRecordingIdRoute
  '/recordings/from-file': typeof RecordingsFromFileRoute
  '/rooms/$roomId': typeof RoomsRoomIdRoute
  '/recordings/': typeof RecordingsIndexRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/rooms'
    | '/recordings/$recordingId'
    | '/recordings/from-file'
    | '/rooms/$roomId'
    | '/recordings'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/rooms'
    | '/recordings/$recordingId'
    | '/recordings/from-file'
    | '/rooms/$roomId'
    | '/recordings'
  id:
    | '__root__'
    | '/'
    | '/rooms'
    | '/recordings/$recordingId'
    | '/recordings/from-file'
    | '/rooms/$roomId'
    | '/recordings/'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  RoomsRoute: typeof RoomsRoute
  RecordingsRecordingIdRoute: typeof RecordingsRecordingIdRoute
  RecordingsFromFileRoute: typeof RecordingsFromFileRoute
  RoomsRoomIdRoute: typeof RoomsRoomIdRoute
  RecordingsIndexRoute: typeof RecordingsIndexRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  RoomsRoute: RoomsRoute,
  RecordingsRecordingIdRoute: RecordingsRecordingIdRoute,
  RecordingsFromFileRoute: RecordingsFromFileRoute,
  RoomsRoomIdRoute: RoomsRoomIdRoute,
  RecordingsIndexRoute: RecordingsIndexRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/rooms",
        "/recordings/$recordingId",
        "/recordings/from-file",
        "/rooms/$roomId",
        "/recordings/"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/rooms": {
      "filePath": "rooms.tsx"
    },
    "/recordings/$recordingId": {
      "filePath": "recordings/$recordingId.tsx"
    },
    "/recordings/from-file": {
      "filePath": "recordings/from-file.tsx"
    },
    "/rooms/$roomId": {
      "filePath": "rooms_.$roomId.tsx"
    },
    "/recordings/": {
      "filePath": "recordings/index.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
