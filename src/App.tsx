import { useEffect } from 'react'
import { findSeat, parseSeatId } from './data/seats'
import { SECTION_BY_ID } from './data/stadium'
import { go, useRoute } from './lib/router'
import { CheckoutScreen } from './screens/CheckoutScreen'
import { OverviewScreen } from './screens/OverviewScreen'
import { SeatScreen } from './screens/SeatScreen'
import { ViewScreen } from './screens/ViewScreen'

/** Resolve the URL into concrete section/seat objects; invalid links fall back to the map. */
function useResolved() {
  const route = useRoute()
  if (route.name === 'seats') {
    const section = SECTION_BY_ID.get(route.section)
    if (section?.status === 'available') return { route, section, seat: undefined }
  }
  if (route.name === 'view' || route.name === 'checkout') {
    const p = parseSeatId(route.seat)
    const section = SECTION_BY_ID.get(p.section)
    const seat = section && findSeat(section, p.row, p.number)
    // A seat that was never available (e.g. a hand-edited link) can't be viewed or bought.
    if (section && seat && section.status === 'available' && seat.state === 'available') return { route, section, seat }
  }
  return { route: route.name === 'overview' ? route : null, section: undefined, seat: undefined }
}

export default function App() {
  const { route, section, seat } = useResolved()

  useEffect(() => {
    if (!route) go({ name: 'overview' }, { replace: true })
  }, [route])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route?.name])

  if (!route) return null
  const key = route.name + (section?.id ?? '')
  return (
    <div className="screen-enter" key={key}>
      {route.name === 'overview' && <OverviewScreen />}
      {route.name === 'seats' && section && <SeatScreen section={section} seatId={route.seat} />}
      {route.name === 'view' && section && seat && <ViewScreen section={section} seat={seat} />}
      {route.name === 'checkout' && section && seat && <CheckoutScreen section={section} seat={seat} />}
    </div>
  )
}
