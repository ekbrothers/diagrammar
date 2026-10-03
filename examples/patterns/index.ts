import type { Example } from '../index.ts';
import * as roundRobin from './round-robin.ts';
import * as push from './push.ts';
import * as pull from './pull.ts';
import * as pubSub from './pub-sub.ts';
import * as fanOutFanIn from './fan-out-fan-in.ts';
import * as requestReply from './request-reply.ts';
import * as circuitBreaker from './circuit-breaker.ts';
import * as cqrs from './cqrs.ts';
import * as staticSite from './static-site.ts';
import * as saga from './saga.ts';

export const patterns: Example[] = [
  {
    slug: 'round-robin',
    title: 'Round-robin load balancing',
    blurb: 'The balancer hands each new request to the next server in the list, then starts over at the top.',
    file: 'patterns/round-robin.ts',
    ...roundRobin,
  },
  {
    slug: 'push',
    title: 'Push',
    blurb: 'The sender delivers as soon as something happens. Receivers don\'t ask. Good when updates are rare and should arrive fast.',
    file: 'patterns/push.ts',
    ...push,
  },
  {
    slug: 'pull',
    title: 'Pull',
    blurb: 'The receiver asks on its own schedule. It sets the pace, so a slow receiver never gets flooded, at the cost of some delay.',
    file: 'patterns/pull.ts',
    ...pull,
  },
  {
    slug: 'pub-sub',
    title: 'Publish and subscribe',
    blurb: 'Publishers don\'t know who listens. Each subscriber gets its own copy of every message on the topic.',
    file: 'patterns/pub-sub.ts',
    ...pubSub,
  },
  {
    slug: 'fan-out-fan-in',
    title: 'Fan-out and fan-in',
    blurb: 'Split one job into pieces that run in parallel, then gather the results. Total time is the slowest piece, not the sum.',
    file: 'patterns/fan-out-fan-in.ts',
    ...fanOutFanIn,
  },
  {
    slug: 'request-reply',
    title: 'Request and reply',
    blurb: 'The caller waits for an answer. Dashed lines show the replies.',
    file: 'patterns/request-reply.ts',
    ...requestReply,
  },
  {
    slug: 'circuit-breaker',
    title: 'Circuit breaker',
    blurb: 'After repeated failures the breaker opens and stops calling the failing service. Callers get a fallback instead of waiting on timeouts.',
    file: 'patterns/circuit-breaker.ts',
    ...circuitBreaker,
  },
  {
    slug: 'cqrs',
    title: 'CQRS',
    blurb: 'Writes and reads use different models. Commands change the write store, and events bring the read store up to date.',
    file: 'patterns/cqrs.ts',
    ...cqrs,
  },
  {
    slug: 'static-site',
    title: 'Static site behind a CDN',
    blurb: 'Build once, upload to storage, and let the CDN serve it from the edge.',
    file: 'patterns/static-site.ts',
    ...staticSite,
  },
  {
    slug: 'saga',
    title: 'Saga with compensation',
    blurb: 'A long process split into local steps. If one fails, earlier steps are undone by compensating actions.',
    file: 'patterns/saga.ts',
    ...saga,
  },
];
