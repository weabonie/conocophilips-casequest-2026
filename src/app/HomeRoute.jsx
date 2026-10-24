import Home from '../features/home/index.jsx'
import { useData } from './DataContext.jsx'
import { useCurrentUser } from '../domain/auth.js'

// The shell owns widget registration. Keeping this adapter small lets the home
// screen stay independent from feature implementation details and permissions.
export default function HomeRoute({ widgetComponents }) {
  const { data } = useData()
  const user = useCurrentUser()
  return <Home data={data} user={user} widgetComponents={widgetComponents} />
}
