/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as RoomRoomIdImport } from './routes/room.$roomId'

// Create Virtual Routes

const ExampleLazyImport = createFileRoute('/example')()

// Create/Update Routes

const ExampleLazyRoute = ExampleLazyImport.update({
  path: '/example',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/example.lazy').then((d) => d.Route))

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const RoomRoomIdRoute = RoomRoomIdImport.update({
  path: '/room/$roomId',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/example': {
      preLoaderRoute: typeof ExampleLazyImport
      parentRoute: typeof rootRoute
    }
    '/room/$roomId': {
      preLoaderRoute: typeof RoomRoomIdImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  ExampleLazyRoute,
  RoomRoomIdRoute,
])

/* prettier-ignore-end */
