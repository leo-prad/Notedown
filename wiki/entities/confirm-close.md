# Confirm close — `src/components/ConfirmClose.tsx`

The modal appears only when [[store]] has a `confirmCloseId` and its tab still
exists. Save calls `saveTab` then rechecks dirty state before closing; cancel
or a backdrop click clears the pending ID; Don't Save closes immediately.

This protects close paths that use `attemptCloseTab`. It does not intercept
the direct `closeTab` call in [[menu-bar]], which is documented in
[[known-limitations]].

