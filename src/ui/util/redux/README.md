# Redux?

This folder contains a highly simplified implementation of some of the core
concepts of the [Redux][redux] library. The idea is to provide (relatively)
simple global state management with an api that is similar enough to the "real"
Redux, so that migrating to Redux should be relatively easy if there would ever
be a need for it.

[redux]: https://redux.js.org/

## Why not just use Redux?

I (@dominiksta) am afraid of dependencies :(

More seriously, I do not like including dependencies in my personal projects if
I can help it. I want Wournal to be require as little maintenance as possible in
the future. Migrating to newer versions of a library like Redux does not sound
like something I would want to do if I can avoid it.

## Usage

If you are not yet familiar with Redux, it is highly recommended to first read
through at least the first chapters of the [Redux Turorial][redux-tut].

You can look in the [src/ui/global-state](../../global-state) directory for how
to set up a `Store` and the simply grep for `useDispatch` and `useSelector` to
see how to use those.

Aside from api implementation details, there is one core difference between
Redux and this code. Wournal expects you to use multiple stores. This is because
the `useSelector` hook triggers a component update every time anything in the
given store changes, not just when the selected part of the state changes. The
reason for this limitation is simply a lack of time to implement it
differently. This limitation also means that this code is *not* suitable for
large scale projects with a lot of global state.

[redux-tut]: https://redux.js.org/tutorials/essentials/part-1-overview-concepts
