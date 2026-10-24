import { useCurrentUser } from '../../domain/auth.js'
import { can, ACTIONS } from '../../domain/permissions.js'
export function DispatchLauncher() {
  const user = useCurrentUser()
  return can(user, ACTIONS.RUN_DISPATCH_CHECK) ? <a className="primary-button" href="#/dispatch">Run pre-dispatch check</a> : null
}
